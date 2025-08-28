package app

import (
	"github.com/dmitrorlov/splitr/backend/entity"
)

// AddHost adds a new host.
func (a *App) AddHost(address, description string) (*entity.Host, error) {
	host, err := entity.NewHost(address, description)
	if err != nil {
		return nil, err
	}

	return a.hostUC.Add(a.ctx, host)
}

// ListHosts returns all hosts.
func (a *App) ListHosts(search string) ([]*entity.Host, error) {
	return a.hostUC.List(a.ctx, &entity.ListHostFilter{Search: search})
}

// DeleteHost deletes a host by ID.
func (a *App) DeleteHost(id uint64) error {
	return a.hostUC.Delete(a.ctx, id)
}
