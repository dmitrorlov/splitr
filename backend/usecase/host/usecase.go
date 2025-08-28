package host

import (
	"context"

	"github.com/dmitrorlov/splitr/backend/entity"
	"github.com/dmitrorlov/splitr/backend/storage"
)

type UseCase struct {
	hostStorage storage.Host
}

func New(hostStorage storage.Host) *UseCase {
	return &UseCase{
		hostStorage: hostStorage,
	}
}

func (u *UseCase) Add(ctx context.Context, host *entity.Host) (*entity.Host, error) {
	return u.hostStorage.Add(ctx, host)
}

func (u *UseCase) List(ctx context.Context, filter *entity.ListHostFilter) ([]*entity.Host, error) {
	return u.hostStorage.List(ctx, filter)
}

func (u *UseCase) Delete(ctx context.Context, id uint64) error {
	return u.hostStorage.Delete(ctx, id)
}
