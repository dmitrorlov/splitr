package network

import (
	"context"
	"errors"
	"fmt"

	"github.com/dmitrorlov/splitr/backend/entity"
	"github.com/dmitrorlov/splitr/backend/pkg/errs"
	"github.com/dmitrorlov/splitr/backend/storage"
	"github.com/dmitrorlov/splitr/backend/usecase"
)

type UseCase struct {
	commandExecutorUC  usecase.CommandExecutor
	networkHostSetupUC usecase.NetworkHostSetup
	networkStorage     storage.Network
}

func New(
	commandExecutorUC usecase.CommandExecutor,
	networkStorage storage.Network,
	networkHostSetupUC usecase.NetworkHostSetup,
) *UseCase {
	return &UseCase{
		commandExecutorUC:  commandExecutorUC,
		networkStorage:     networkStorage,
		networkHostSetupUC: networkHostSetupUC,
	}
}

func (u *UseCase) Add(ctx context.Context, network *entity.Network) (*entity.Network, error) {
	return u.networkStorage.Add(ctx, network)
}

func (u *UseCase) List(
	ctx context.Context,
	filter *entity.ListNetworkFilter,
) ([]*entity.NetworkWithStatus, error) {
	networks, err := u.networkStorage.List(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list networks: %w", err)
	}

	currentVPNService, err := u.commandExecutorUC.GetCurrentVPN(ctx)
	if err != nil && !errors.Is(err, errs.ErrVPNServiceNotFound) {
		return nil, fmt.Errorf("failed to get current VPN: %w", err)
	}

	networksWithStatus := make([]*entity.NetworkWithStatus, len(networks))
	for i, network := range networks {
		networksWithStatus[i] = &entity.NetworkWithStatus{
			Network:  *network,
			IsActive: entity.VPNService(network.Name) == currentVPNService,
		}
	}

	return networksWithStatus, nil
}

func (u *UseCase) Delete(ctx context.Context, id uint64) error {
	if err := u.networkHostSetupUC.ResetByNetworkID(ctx, id); err != nil {
		return fmt.Errorf("failed to reset network host setup: %w", err)
	}
	return u.networkStorage.Delete(ctx, id)
}

func (u *UseCase) ListVPNServices(ctx context.Context) ([]entity.VPNService, error) {
	vpnServices, err := u.commandExecutorUC.ListVPN(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list VPN: %w", err)
	}

	return vpnServices, nil
}
