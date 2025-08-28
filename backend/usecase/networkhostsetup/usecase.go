package networkhostsetup

import (
	"context"
	"errors"
	"fmt"
	"maps"
	"net"
	"slices"

	"github.com/avito-tech/go-transaction-manager/trm/v2"

	"github.com/dmitrorlov/splitr/backend/entity"
	"github.com/dmitrorlov/splitr/backend/pkg/errs"
	"github.com/dmitrorlov/splitr/backend/storage"
	"github.com/dmitrorlov/splitr/backend/usecase"
)

type UseCase struct {
	trm trm.Manager

	commandExecutorUC       usecase.CommandExecutor
	networkStorage          storage.Network
	networkHostStorage      storage.NetworkHost
	networkHostSetupStorage storage.NetworkHostSetup
}

func New(
	trm trm.Manager,
	commandExecutorUC usecase.CommandExecutor,
	networkStorage storage.Network,
	networkHostStorage storage.NetworkHost,
	networkHostSetupStorage storage.NetworkHostSetup,
) *UseCase {
	return &UseCase{
		trm:                     trm,
		commandExecutorUC:       commandExecutorUC,
		networkStorage:          networkStorage,
		networkHostStorage:      networkHostStorage,
		networkHostSetupStorage: networkHostSetupStorage,
	}
}

func (u *UseCase) SyncByNetworkID(ctx context.Context, networkID uint64) error {
	// Retrieve network and setups
	network, networkHostSetupList, err := u.listNetworkAndSetupsByNetworkID(ctx, networkID)
	if err != nil {
		return err
	}

	// Check if this network is currently active
	currentVPN, err := u.commandExecutorUC.GetCurrentVPN(ctx)
	if err != nil {
		if errors.Is(err, errs.ErrVPNServiceNotFound) {
			return nil
		}
		return fmt.Errorf("failed to get current VPN: %w", err)
	}

	// If the network is not the currently active VPN, return successful no-op
	if entity.VPNService(network.Name) != currentVPN {
		return nil
	}

	err = u.trm.Do(ctx, func(ctx context.Context) error {
		if len(networkHostSetupList) > 0 {
			networkHostIDsMap := make(map[uint64]struct{}, len(networkHostSetupList))
			for _, networkHostSetup := range networkHostSetupList {
				networkHostIDsMap[networkHostSetup.NetworkHostID] = struct{}{}
			}

			trErr := u.networkHostSetupStorage.DeleteBatchByNetworkHostIDs(ctx,
				slices.Collect(maps.Keys(networkHostIDsMap)))
			if trErr != nil {
				return fmt.Errorf(
					"failed to delete network host setup list by network host ids: %w",
					trErr,
				)
			}

			trErr = u.networkHostSetupStorage.AddBatch(ctx, networkHostSetupList)
			if trErr != nil {
				return fmt.Errorf("failed to add network host setup list: %w", trErr)
			}
		}

		trErr := u.commandExecutorUC.SetNetworkAdditionalRoutes(ctx, network, networkHostSetupList)
		if trErr != nil {
			return fmt.Errorf("failed to set network additional routes: %w", trErr)
		}

		return nil
	})
	if err != nil {
		return fmt.Errorf("failed to apply transaction: %w", err)
	}

	return nil
}

// ResetByNetworkID resets additional routes for a network by setting them to empty.
func (u *UseCase) ResetByNetworkID(ctx context.Context, networkID uint64) error {
	network, err := u.networkStorage.Get(ctx, networkID)
	if err != nil {
		return fmt.Errorf("failed to get network by id %d: %w", networkID, err)
	}

	// Add active-network check and early return
	currentVPN, err := u.commandExecutorUC.GetCurrentVPN(ctx)
	if err != nil {
		if errors.Is(err, errs.ErrVPNServiceNotFound) {
			// No VPN service found, return successful no-op
			return nil
		}
		return fmt.Errorf("failed to get current VPN: %w", err)
	}

	// If the network is not the currently active VPN, return successful no-op
	if entity.VPNService(network.Name) != currentVPN {
		return nil
	}

	err = u.commandExecutorUC.SetNetworkAdditionalRoutes(ctx, network, []*entity.NetworkHostSetup{})
	if err != nil {
		return fmt.Errorf("failed to reset network additional routes: %w", err)
	}

	return nil
}

func (u *UseCase) listNetworkAndSetupsByNetworkID(
	ctx context.Context,
	networkID uint64,
) (*entity.Network, []*entity.NetworkHostSetup, error) {
	network, err := u.networkStorage.Get(ctx, networkID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get network by id %d: %w", networkID, err)
	}

	networkHostSetupList, err := u.listSetupsByNetwork(ctx, network)
	if err != nil {
		return nil, nil, err
	}

	return network, networkHostSetupList, nil
}

func (u *UseCase) listSetupsByNetwork(
	ctx context.Context,
	network *entity.Network,
) ([]*entity.NetworkHostSetup, error) {
	networkHosts, err := u.networkHostStorage.List(ctx, &entity.ListNetworkHostFilter{
		NetworkID: []uint64{network.ID},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list network hosts: %w", err)
	}

	currentNetworkInfo, err := u.getCurrentNetworkInfo(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get current network info: %w", err)
	}

	networkHostSetupList := make([]*entity.NetworkHostSetup, 0, len(networkHosts))
	for _, networkHost := range networkHosts {
		hostIPList, lookupErr := u.listIPByAddress(ctx, networkHost.Address)
		if lookupErr != nil {
			return nil, fmt.Errorf(
				"failed to list IP by address %s: %w",
				networkHost.Address,
				lookupErr,
			)
		}

		for _, hostIP := range hostIPList {
			networkHostSetupList = append(networkHostSetupList, &entity.NetworkHostSetup{
				NetworkHostID: networkHost.ID,
				NetworkHostIP: hostIP,
				SubnetMask:    currentNetworkInfo.SubnetMask,
				Router:        currentNetworkInfo.Router,
			})
		}
	}

	return networkHostSetupList, nil
}

func (u *UseCase) getCurrentNetworkInfo(ctx context.Context) (*entity.NetworkInfo, error) {
	defaultNetworkInterface, err := u.commandExecutorUC.GetDefaultNetworkInterface(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get default network interface: %w", err)
	}

	networkService, err := u.commandExecutorUC.GetNetworkServiceByNetworkInterface(
		ctx,
		defaultNetworkInterface,
	)
	if err != nil {
		return nil, fmt.Errorf(
			"failed to get network service by network interface %s: %w",
			defaultNetworkInterface,
			err,
		)
	}

	networkInfo, err := u.commandExecutorUC.GetNetworkInfoByNetworkService(ctx, networkService)
	if err != nil {
		return nil, fmt.Errorf(
			"failed to get network info by network service %s: %w",
			networkService,
			err,
		)
	}

	return networkInfo, nil
}

func (u *UseCase) listIPByAddress(ctx context.Context, address string) ([]string, error) {
	resolver := net.DefaultResolver
	ips, err := resolver.LookupIPAddr(ctx, address)
	if err != nil {
		return nil, fmt.Errorf("failed to lookup IP for address %s: %w", address, err)
	}

	hostIPs := make([]string, 0, len(ips))
	for _, ip := range ips {
		if ip.IP.To4() == nil {
			continue
		}

		hostIPs = append(hostIPs, ip.String())
	}

	if len(hostIPs) == 0 {
		return nil, fmt.Errorf("no IPv4 addresses found for address %s", address)
	}

	return hostIPs, nil
}
