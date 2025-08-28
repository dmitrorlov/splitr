package command

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os/exec"
	"strings"

	"github.com/dmitrorlov/splitr/backend/entity"
	"github.com/dmitrorlov/splitr/backend/pkg/errs"
)

const (
	cmdSCUtil       = "scutil"
	cmdRoute        = "route"
	cmdNetworkSetup = "networksetup"
	cmdOpen         = "open"

	substringL2tpNetworkType      = "[PPP:L2TP]"
	substringL2tpNetworkConnected = "(Connected)"
	substringRouteInterface       = "interface"

	minNetworkInterfaceSplittedLength = 2
)

type Executor struct {
	outputParser *outputParser

	cmdListVPNArgs                    []string
	cmdGetDefaultInterfaceArgs        []string
	cmdListNetworkServiceArgs         []string
	cmdGetNetworkServiceInfoArgs      []string
	cmdSetNetworkAdditionalRoutesArgs []string
	cmdOpenInFinderArgs               []string
}

func NewExecutor() *Executor {
	return &Executor{
		outputParser:                      newOutputParser(),
		cmdListVPNArgs:                    []string{"--nc", "list"},
		cmdGetDefaultInterfaceArgs:        []string{"get", "default"},
		cmdListNetworkServiceArgs:         []string{"-listnetworkserviceorder"},
		cmdGetNetworkServiceInfoArgs:      []string{"-getinfo"},
		cmdSetNetworkAdditionalRoutesArgs: []string{"-setadditionalroutes"},
		cmdOpenInFinderArgs:               []string{"-R"},
	}
}

func (e *Executor) GetDefaultNetworkInterface(ctx context.Context) (entity.NetworkInterface, error) {
	output, err := e.syncExecuteCommand(ctx, &entity.Command{
		Executable: cmdRoute,
		Args:       e.cmdGetDefaultInterfaceArgs,
	})
	if err != nil {
		return "", fmt.Errorf("failed to sync execute command: %w", err)
	}

	var networkInterface entity.NetworkInterface
	for _, line := range output {
		if !strings.Contains(line, substringRouteInterface) {
			continue
		}

		splitted := strings.Split(strings.TrimSpace(line), " ")
		if len(splitted) < minNetworkInterfaceSplittedLength {
			continue
		}

		networkInterface = entity.NetworkInterface(splitted[1])
	}

	if networkInterface == "" {
		return "", errors.New("failed to find network interface in command output")
	}

	return networkInterface, nil
}

func (e *Executor) GetNetworkServiceByNetworkInterface(
	ctx context.Context,
	networkInterface entity.NetworkInterface,
) (entity.NetworkService, error) {
	commandOutput, err := e.syncExecuteCommand(ctx, &entity.Command{
		Executable: cmdNetworkSetup,
		Args:       e.cmdListNetworkServiceArgs,
	})
	if err != nil {
		return "", fmt.Errorf("failed to sync execute command: %w", err)
	}

	for i, line := range commandOutput {
		if line == "" {
			continue
		}

		if i+1 >= len(commandOutput) {
			continue
		}

		lineWithInterfaceName := commandOutput[i+1]
		if !strings.Contains(lineWithInterfaceName, string(networkInterface)) {
			continue
		}

		interfaceNameFromLine := e.outputParser.parseInterfaceName(lineWithInterfaceName)
		if interfaceNameFromLine == "" {
			continue
		}

		networkServiceName := e.outputParser.parseNetworkServiceName(line)
		if networkServiceName == "" {
			continue
		}

		return entity.NetworkService(networkServiceName), nil
	}

	return "", fmt.Errorf("failed to find network service by interface %s", networkInterface)
}

func (e *Executor) GetNetworkInfoByNetworkService(
	ctx context.Context,
	networkService entity.NetworkService,
) (*entity.NetworkInfo, error) {
	commandOutput, err := e.syncExecuteCommand(ctx, &entity.Command{
		Executable: cmdNetworkSetup,
		Args:       append(e.cmdGetNetworkServiceInfoArgs, string(networkService)),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to sync execute command: %w", err)
	}

	var networkInfo entity.NetworkInfo
	for _, line := range commandOutput {
		subnetMaskFromLine := e.outputParser.parseSubnetMask(line)
		routerFromLine := e.outputParser.parseRouter(line)

		if subnetMaskFromLine != "" {
			networkInfo.SubnetMask = subnetMaskFromLine
		}

		if routerFromLine != "" {
			networkInfo.Router = routerFromLine
		}
	}

	if networkInfo.SubnetMask == "" || networkInfo.Router == "" {
		return nil, errors.New("failed to find network info in command output")
	}

	return &networkInfo, nil
}

func (e *Executor) SetNetworkAdditionalRoutes(
	ctx context.Context,
	network *entity.Network,
	networkHostSetupList []*entity.NetworkHostSetup,
) error {
	args := append([]string{}, e.cmdSetNetworkAdditionalRoutesArgs...)
	args = append(args, network.Name)

	for _, networkHostSetup := range networkHostSetupList {
		args = append(args, []string{
			networkHostSetup.NetworkHostIP,
			networkHostSetup.SubnetMask,
			networkHostSetup.Router,
		}...)
	}

	_, err := e.syncExecuteCommand(ctx, &entity.Command{
		Executable: cmdNetworkSetup,
		Args:       args,
	})
	if err != nil {
		return fmt.Errorf("failed to sync execute command: %w", err)
	}

	return nil
}

func (e *Executor) ListVPN(ctx context.Context) ([]entity.VPNService, error) {
	output, err := e.syncExecuteCommand(ctx, &entity.Command{
		Executable: cmdSCUtil,
		Args:       e.cmdListVPNArgs,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to sync execute command: %w", err)
	}

	var vpnNames []entity.VPNService
	for _, line := range output {
		if !strings.Contains(line, substringL2tpNetworkType) {
			continue
		}

		parsedName := e.outputParser.parseVPNName(line)
		if parsedName == "" {
			continue
		}

		vpnNames = append(vpnNames, entity.VPNService(parsedName))
	}

	return vpnNames, nil
}

func (e *Executor) GetCurrentVPN(ctx context.Context) (entity.VPNService, error) {
	output, err := e.syncExecuteCommand(ctx, &entity.Command{
		Executable: cmdSCUtil,
		Args:       e.cmdListVPNArgs,
	})
	if err != nil {
		return "", fmt.Errorf("failed to sync execute command: %w", err)
	}

	for _, line := range output {
		if !strings.Contains(line, substringL2tpNetworkType) || !strings.Contains(line, substringL2tpNetworkConnected) {
			continue
		}

		parsedName := e.outputParser.parseVPNName(line)
		if parsedName == "" {
			continue
		}

		return entity.VPNService(parsedName), nil
	}

	return "", errs.ErrVPNServiceNotFound
}

func (e *Executor) OpenInFinder(ctx context.Context, path string) error {
	_, err := e.syncExecuteCommand(ctx, &entity.Command{
		Executable: cmdOpen,
		Args:       append(e.cmdOpenInFinderArgs, path),
	})
	if err != nil {
		return fmt.Errorf("failed to sync execute command: %w", err)
	}

	return nil
}

func (e *Executor) syncExecuteCommand(
	ctx context.Context,
	command *entity.Command,
) ([]string, error) {
	slog.InfoContext(ctx, fmt.Sprintf("executing command: %s", command))

	cmd := exec.CommandContext(ctx, command.Executable, command.Args...) //nolint:gosec // command is not user input
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to execute command: %w", err)
	}

	return strings.Split(string(output), "\n"), nil
}
