package networkhost

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/avito-tech/go-transaction-manager/trm/v2"

	"github.com/dmitrorlov/splitr/backend/entity"
	"github.com/dmitrorlov/splitr/backend/pkg/errs"
	"github.com/dmitrorlov/splitr/backend/storage"
	"github.com/dmitrorlov/splitr/backend/usecase"
)

type UseCase struct {
	trm                trm.Manager
	networkHostSetupUC usecase.NetworkHostSetup
	networkStorage     storage.Network
	networkHostStorage storage.NetworkHost
}

func New(
	trm trm.Manager,
	networkHostSetupUC usecase.NetworkHostSetup,
	networkStorage storage.Network,
	networkHostStorage storage.NetworkHost,
) *UseCase {
	return &UseCase{
		trm:                trm,
		networkHostSetupUC: networkHostSetupUC,
		networkStorage:     networkStorage,
		networkHostStorage: networkHostStorage,
	}
}

func (u *UseCase) Add(
	ctx context.Context,
	networkHost *entity.NetworkHost,
) (*entity.NetworkHost, error) {
	var res *entity.NetworkHost
	err := u.trm.Do(ctx, func(ctx context.Context) error {
		addedHost, trErr := u.networkHostStorage.Add(ctx, networkHost)
		if trErr != nil {
			return fmt.Errorf("failed to add network host: %w", trErr)
		}

		res = addedHost
		trErr = u.networkHostSetupUC.SyncByNetworkID(ctx, networkHost.NetworkID)
		if trErr != nil {
			return fmt.Errorf("failed to sync network host setup: %w", trErr)
		}

		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to apply transaction: %w", err)
	}

	return res, nil
}

func (u *UseCase) List(
	ctx context.Context,
	filter *entity.ListNetworkHostFilter,
) ([]*entity.NetworkHost, error) {
	return u.networkHostStorage.List(ctx, filter)
}

func (u *UseCase) Delete(ctx context.Context, id uint64) error {
	networkHost, err := u.networkHostStorage.Get(ctx, id)
	if err != nil {
		if errors.Is(err, errs.ErrNetworkHostNotFound) {
			return nil
		}

		return fmt.Errorf("failed to get network host: %w", err)
	}

	err = u.trm.Do(ctx, func(ctx context.Context) error {
		trErr := u.networkHostStorage.Delete(ctx, id)
		if trErr != nil {
			return fmt.Errorf("failed to delete network host: %w", trErr)
		}

		trErr = u.networkHostSetupUC.SyncByNetworkID(ctx, networkHost.NetworkID)
		if trErr != nil {
			return fmt.Errorf("failed to sync network host setup: %w", trErr)
		}

		return nil
	})
	if err != nil {
		return fmt.Errorf("failed to apply transaction: %w", err)
	}

	return nil
}

// ExportByNetworkIDForContext exports network hosts without including the network ID in the payload
// This is suitable for exports from a specific network context where the network is already known.
func (u *UseCase) ExportByNetworkIDForContext(
	ctx context.Context,
	networkID uint64,
) (*entity.NetworkHostContextExportPayload, error) {
	// Validate that the network exists
	_, err := u.networkStorage.Get(ctx, networkID)
	if err != nil {
		if errors.Is(err, errs.ErrNetworkNotFound) {
			return nil, fmt.Errorf("network with ID %d not found: %w", networkID, err)
		}
		return nil, fmt.Errorf("failed to validate network: %w", err)
	}

	// Get all hosts for the network
	networkHosts, err := u.networkHostStorage.List(ctx, &entity.ListNetworkHostFilter{
		NetworkID: []uint64{networkID},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list network hosts: %w", err)
	}

	// Convert to DTOs
	hostDTOs := make([]entity.NetworkHostDTO, 0, len(networkHosts))
	for _, host := range networkHosts {
		dto := entity.NetworkHostDTO{
			Address: host.Address,
		}
		if host.Description != nil {
			dto.Description = *host.Description
		}
		hostDTOs = append(hostDTOs, dto)
	}

	// Create export payload without network ID
	payload := &entity.NetworkHostContextExportPayload{
		ExportDate: time.Now(),
		Hosts:      hostDTOs,
	}

	return payload, nil
}

func (u *UseCase) ImportByNetworkIDFromJSON(
	ctx context.Context,
	networkID uint64,
	jsonData string,
) error {
	contextPayload, err := u.unmarshalImportData(jsonData)
	if err != nil {
		return err
	}

	if validateErr := u.validateNetworkExists(ctx, networkID); validateErr != nil {
		return validateErr
	}

	return u.importHostsInTransaction(ctx, networkID, contextPayload.Hosts)
}

func (u *UseCase) unmarshalImportData(jsonData string) (*entity.NetworkHostContextExportPayload, error) {
	var contextPayload entity.NetworkHostContextExportPayload
	err := json.Unmarshal([]byte(jsonData), &contextPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal import data as either format: %w", err)
	}
	return &contextPayload, nil
}

func (u *UseCase) validateNetworkExists(ctx context.Context, networkID uint64) error {
	_, err := u.networkStorage.Get(ctx, networkID)
	if err != nil {
		if errors.Is(err, errs.ErrNetworkNotFound) {
			return fmt.Errorf("network with ID %d not found: %w", networkID, err)
		}
		return fmt.Errorf("failed to validate network: %w", err)
	}
	return nil
}

func (u *UseCase) importHostsInTransaction(
	ctx context.Context,
	networkID uint64,
	hostDTOs []entity.NetworkHostDTO,
) error {
	err := u.trm.Do(ctx, func(ctx context.Context) error {
		importedCount, err := u.processHostImports(ctx, networkID, hostDTOs)
		if err != nil {
			return err
		}

		return u.syncIfNeeded(ctx, networkID, importedCount)
	})

	if err != nil {
		return fmt.Errorf("failed to import network hosts: %w", err)
	}

	return nil
}

func (u *UseCase) processHostImports(
	ctx context.Context,
	networkID uint64,
	hostDTOs []entity.NetworkHostDTO,
) (int, error) {
	importedCount := 0

	for _, hostDTO := range hostDTOs {
		exists, err := u.checkHostExists(ctx, networkID, hostDTO.Address)
		if err != nil {
			return 0, err
		}

		if exists {
			continue
		}

		added, addErr := u.createAndAddHost(ctx, networkID, hostDTO)
		if addErr != nil {
			return 0, addErr
		}

		if added {
			importedCount++
		}
	}

	return importedCount, nil
}

func (u *UseCase) checkHostExists(ctx context.Context, networkID uint64, address string) (bool, error) {
	existingFilter := &entity.ListNetworkHostFilter{
		NetworkID: []uint64{networkID},
		Address:   []string{address},
	}
	existing, err := u.networkHostStorage.List(ctx, existingFilter)
	if err != nil {
		return false, fmt.Errorf("failed to check existing host %s: %w", address, err)
	}
	return len(existing) > 0, nil
}

func (u *UseCase) createAndAddHost(ctx context.Context, networkID uint64, hostDTO entity.NetworkHostDTO) (bool, error) {
	networkHost, err := entity.NewNetworkHost(
		networkID,
		hostDTO.Address,
		hostDTO.Description,
	)
	if err != nil {
		return false, fmt.Errorf(
			"failed to create network host for %s: %w",
			hostDTO.Address,
			err,
		)
	}

	_, err = u.networkHostStorage.Add(ctx, networkHost)
	if err != nil {
		if errors.Is(err, errs.ErrNetworkHostAlreadyExists) {
			return false, nil
		}
		return false, fmt.Errorf("failed to add network host %s: %w", hostDTO.Address, err)
	}

	return true, nil
}

func (u *UseCase) syncIfNeeded(ctx context.Context, networkID uint64, importedCount int) error {
	if importedCount > 0 {
		err := u.networkHostSetupUC.SyncByNetworkID(ctx, networkID)
		if err != nil {
			return fmt.Errorf("failed to sync network host setup: %w", err)
		}
	}
	return nil
}
