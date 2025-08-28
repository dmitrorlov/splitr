package storage

import (
	"context"

	"github.com/dmitrorlov/splitr/backend/entity"
)

type Host interface {
	Add(ctx context.Context, host *entity.Host) (*entity.Host, error)
	List(ctx context.Context, filter *entity.ListHostFilter) ([]*entity.Host, error)
	Delete(ctx context.Context, id uint64) error
}

type Network interface {
	Add(ctx context.Context, network *entity.Network) (*entity.Network, error)
	Get(ctx context.Context, id uint64) (*entity.Network, error)
	List(ctx context.Context, filter *entity.ListNetworkFilter) ([]*entity.Network, error)
	Delete(ctx context.Context, id uint64) error
}

type NetworkHost interface {
	Add(ctx context.Context, networkHost *entity.NetworkHost) (*entity.NetworkHost, error)
	Get(ctx context.Context, id uint64) (*entity.NetworkHost, error)
	List(ctx context.Context, filter *entity.ListNetworkHostFilter) ([]*entity.NetworkHost, error)
	Delete(ctx context.Context, id uint64) error
}

type NetworkHostSetup interface {
	AddBatch(ctx context.Context, batch []*entity.NetworkHostSetup) error
	DeleteBatchByNetworkHostIDs(ctx context.Context, networkHostIDs []uint64) error
}
