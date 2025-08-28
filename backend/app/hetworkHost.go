package app

import (
	"encoding/json"
	"fmt"

	"github.com/dmitrorlov/splitr/backend/entity"
)

// AddNetworkHost adds a host to a network.
func (a *App) AddNetworkHost(networkID uint64, address, description string) (*entity.NetworkHost, error) {
	networkHost, err := entity.NewNetworkHost(networkID, address, description)
	if err != nil {
		return nil, err
	}

	return a.networkHostUC.Add(a.ctx, networkHost)
}

// ListNetworkHosts returns hosts for a network.
func (a *App) ListNetworkHosts(networkID uint64, searchTerm string) ([]*entity.NetworkHost, error) {
	filter := &entity.ListNetworkHostFilter{
		NetworkID: []uint64{networkID},
		Search:    searchTerm,
	}
	return a.networkHostUC.List(a.ctx, filter)
}

// DeleteNetworkHost removes a host from a network.
func (a *App) DeleteNetworkHost(id uint64) error {
	return a.networkHostUC.Delete(a.ctx, id)
}

// SyncNetworkHostSetup synchronizes network host setup.
func (a *App) SyncNetworkHostSetup(networkID uint64) error {
	return a.networkHostSetupUC.SyncByNetworkID(a.ctx, networkID)
}

// ResetNetworkHostSetup resets additional routes for a network.
func (a *App) ResetNetworkHostSetup(networkID uint64) error {
	return a.networkHostSetupUC.ResetByNetworkID(a.ctx, networkID)
}

// ExportNetworkHosts exports network hosts to JSON without network ID (for context-specific export).
func (a *App) ExportNetworkHosts(networkID uint64) (string, error) {
	payload, err := a.networkHostUC.ExportByNetworkIDForContext(a.ctx, networkID)
	if err != nil {
		return "", fmt.Errorf("failed to export network hosts: %w", err)
	}

	jsonData, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal export data: %w", err)
	}

	return string(jsonData), nil
}

// ImportNetworkHosts imports network hosts from JSON (supports both old and new formats).
func (a *App) ImportNetworkHosts(networkID uint64, jsonData string) error {
	err := a.networkHostUC.ImportByNetworkIDFromJSON(a.ctx, networkID, jsonData)
	if err != nil {
		return fmt.Errorf("failed to import network hosts: %w", err)
	}

	return nil
}
