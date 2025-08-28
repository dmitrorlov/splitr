package app

import (
	"github.com/dmitrorlov/splitr/backend/entity"
)

// AddNetwork adds a new network.
func (a *App) AddNetwork(name string) (*entity.Network, error) {
	network := &entity.Network{
		Name: name,
	}
	return a.networkUC.Add(a.ctx, network)
}

// ListNetworks returns networks with their active status.
func (a *App) ListNetworks(searchTerm string) ([]*entity.NetworkWithStatus, error) {
	networks, err := a.networkUC.List(a.ctx, &entity.ListNetworkFilter{
		Search: searchTerm,
	})
	if err != nil {
		return nil, err
	}

	return networks, nil
}

// DeleteNetwork deletes a network by ID.
func (a *App) DeleteNetwork(id uint64) error {
	return a.networkUC.Delete(a.ctx, id)
}

// ListVPNServices returns available VPN services.
func (a *App) ListVPNServices() ([]entity.VPNService, error) {
	return a.networkUC.ListVPNServices(a.ctx)
}
