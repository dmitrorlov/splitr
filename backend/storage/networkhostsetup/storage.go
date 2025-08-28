package networkhostsetup

import (
	"context"
	"fmt"
	"slices"
	"time"

	sq "github.com/Masterminds/squirrel"

	"github.com/dmitrorlov/splitr/backend/entity"
	"github.com/dmitrorlov/splitr/backend/pkg/database"
)

const (
	addBatchChunkSize    = 10000
	deleteBatchChunkSize = 50000
)

type Storage struct {
	db *database.Database
}

func New(db *database.Database) *Storage {
	return &Storage{
		db: db,
	}
}

func (s *Storage) AddBatch(ctx context.Context, batch []*entity.NetworkHostSetup) error {
	for chuck := range slices.Chunk(batch, addBatchChunkSize) {
		err := s.addBatch(ctx, chuck)
		if err != nil {
			return fmt.Errorf("failed to add batch: %w", err)
		}
	}

	return nil
}

func (s *Storage) addBatch(ctx context.Context, batch []*entity.NetworkHostSetup) error {
	queryBuilder := sq.Insert("network_host_setups").
		Columns(
			"network_host_id",
			"network_host_ip",
			"subnet_mask",
			"router",
			"created_at",
		)

	now := time.Now()
	for _, networkHostSetup := range batch {
		queryBuilder = queryBuilder.Values(
			networkHostSetup.NetworkHostID,
			networkHostSetup.NetworkHostIP,
			networkHostSetup.SubnetMask,
			networkHostSetup.Router,
			now,
		)
	}

	query, params, err := queryBuilder.ToSql()
	if err != nil {
		return fmt.Errorf("failed to build query: %w", err)
	}

	_, err = s.db.GetDB(ctx).ExecContext(ctx, query, params...)
	if err != nil {
		return fmt.Errorf("failed to scan row: %w", err)
	}

	return nil
}

func (s *Storage) DeleteBatchByNetworkHostIDs(ctx context.Context, networkHostIDs []uint64) error {
	for chuck := range slices.Chunk(networkHostIDs, deleteBatchChunkSize) {
		err := s.deleteBatch(ctx, chuck)
		if err != nil {
			return fmt.Errorf("failed to delete batch: %w", err)
		}
	}

	return nil
}

func (s *Storage) deleteBatch(ctx context.Context, networkHostIDs []uint64) error {
	queryBuilder := sq.Delete("network_host_setups").
		Where(sq.Eq{"network_host_id": networkHostIDs})

	query, params, err := queryBuilder.ToSql()
	if err != nil {
		return fmt.Errorf("failed to build query: %w", err)
	}

	_, err = s.db.GetDB(ctx).ExecContext(ctx, query, params...)
	if err != nil {
		return fmt.Errorf("failed to scan row: %w", err)
	}

	return nil
}
