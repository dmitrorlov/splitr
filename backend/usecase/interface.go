package usecase

import (
	"context"

	"github.com/dmitrorlov/splitr/backend/entity"
)

type CommandExecutor interface {
	GetDefaultNetworkInterface(ctx context.Context) (entity.NetworkInterface, error)
	GetNetworkServiceByNetworkInterface(
		ctx context.Context,
		networkInterface entity.NetworkInterface,
	) (entity.NetworkService, error)
	GetNetworkInfoByNetworkService(
		ctx context.Context,
		networkService entity.NetworkService,
	) (*entity.NetworkInfo, error)
	SetNetworkAdditionalRoutes(
		ctx context.Context,
		network *entity.Network,
		networkHostSetupList []*entity.NetworkHostSetup,
	) error
	ListVPN(ctx context.Context) ([]entity.VPNService, error)
	GetCurrentVPN(ctx context.Context) (entity.VPNService, error)
	OpenInFinder(ctx context.Context, path string) error
}

type Host interface {
	Add(ctx context.Context, host *entity.Host) (*entity.Host, error)
	List(ctx context.Context, filter *entity.ListHostFilter) ([]*entity.Host, error)
	Delete(ctx context.Context, id uint64) error
}

type Network interface {
	Add(ctx context.Context, network *entity.Network) (*entity.Network, error)
	List(ctx context.Context, filter *entity.ListNetworkFilter) ([]*entity.NetworkWithStatus, error)
	Delete(ctx context.Context, id uint64) error

	ListVPNServices(ctx context.Context) ([]entity.VPNService, error)
}

type NetworkHost interface {
	Add(ctx context.Context, networkHost *entity.NetworkHost) (*entity.NetworkHost, error)
	List(ctx context.Context, filter *entity.ListNetworkHostFilter) ([]*entity.NetworkHost, error)
	Delete(ctx context.Context, id uint64) error
	ExportByNetworkIDForContext(
		ctx context.Context,
		networkID uint64,
	) (*entity.NetworkHostContextExportPayload, error)
	ImportByNetworkIDFromJSON(ctx context.Context, networkID uint64, jsonData string) error
}

type NetworkHostSetup interface {
	SyncByNetworkID(ctx context.Context, network uint64) error
	ResetByNetworkID(ctx context.Context, networkID uint64) error
}

type Update interface {
	CheckForUpdates() (*entity.UpdateInfo, error)
}
