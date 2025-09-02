package command

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/dmitrorlov/splitr/backend/entity"
	"github.com/dmitrorlov/splitr/backend/pkg/errs"
	"github.com/dmitrorlov/splitr/backend/usecase"
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
	cmdRunner    usecase.CommandRunner

	cmdListVPNArgs                    []string
	cmdGetDefaultInterfaceArgs        []string
	cmdListNetworkServiceArgs         []string
	cmdGetNetworkServiceInfoArgs      []string
	cmdSetNetworkAdditionalRoutesArgs []string
	cmdOpenInFinderArgs               []string
}

func NewExecutor() *Executor {
	return NewExecutorWithRunner(&defaultCommandRunner{})
}

func NewExecutorWithRunner(cmdRunner usecase.CommandRunner) *Executor {
	return &Executor{
		outputParser:                      newOutputParser(),
		cmdRunner:                         cmdRunner,
		cmdListVPNArgs:                    []string{"--nc", "list"},
		cmdGetDefaultInterfaceArgs:        []string{"get", "default"},
		cmdListNetworkServiceArgs:         []string{"-listnetworkserviceorder"},
		cmdGetNetworkServiceInfoArgs:      []string{"-getinfo"},
		cmdSetNetworkAdditionalRoutesArgs: []string{"-setadditionalroutes"},
		cmdOpenInFinderArgs:               []string{"-R"},
	}
}

func (e *Executor) GetDefaultNetworkInterface(ctx context.Context) (entity.NetworkInterface, error) {
	output, err := e.cmdRunner.Run(ctx, cmdRoute, e.cmdGetDefaultInterfaceArgs...)
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
	commandOutput, err := e.cmdRunner.Run(ctx, cmdNetworkSetup, e.cmdListNetworkServiceArgs...)
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
	args := make([]string, 0, len(e.cmdGetNetworkServiceInfoArgs)+1)
	args = append(args, e.cmdGetNetworkServiceInfoArgs...)
	args = append(args, string(networkService))
	commandOutput, err := e.cmdRunner.Run(ctx, cmdNetworkSetup, args...)
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

	_, err := e.cmdRunner.Run(ctx, cmdNetworkSetup, args...)
	if err != nil {
		return fmt.Errorf("failed to sync execute command: %w", err)
	}

	return nil
}

func (e *Executor) ListVPN(ctx context.Context) ([]entity.VPNService, error) {
	output, err := e.cmdRunner.Run(ctx, cmdSCUtil, e.cmdListVPNArgs...)
	if err != nil {
		return nil, fmt.Errorf("failed to sync execute command: %w", err)
	}

	vpnNames := make([]entity.VPNService, 0)
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
	output, err := e.cmdRunner.Run(ctx, cmdSCUtil, e.cmdListVPNArgs...)
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
	args := make([]string, 0, len(e.cmdOpenInFinderArgs)+1)
	args = append(args, e.cmdOpenInFinderArgs...)
	args = append(args, path)
	_, err := e.cmdRunner.Run(ctx, cmdOpen, args...)
	if err != nil {
		return fmt.Errorf("failed to sync execute command: %w", err)
	}

	return nil
}
