package network

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"

	"github.com/dmitrorlov/splitr/backend/entity"
	"github.com/dmitrorlov/splitr/backend/pkg/database"
	"github.com/dmitrorlov/splitr/backend/pkg/errs"
	"github.com/dmitrorlov/splitr/backend/storage"
)

type Storage struct {
	db *database.Database
}

func New(db *database.Database) *Storage {
	return &Storage{
		db: db,
	}
}

func (s *Storage) Add(ctx context.Context, network *entity.Network) (*entity.Network, error) {
	queryBuilder := sq.Insert("networks").
		Columns("name", "created_at").
		Values(network.Name, time.Now()).
		Suffix("RETURNING id, name, created_at")

	query, params, err := queryBuilder.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	row := s.db.GetDB(ctx).QueryRowxContext(ctx, query, params...)

	newTask := new(entity.Network)
	err = row.StructScan(newTask)

	switch {
	case err == nil:
		return newTask, nil
	case errors.Is(err, sql.ErrNoRows):
		return nil, errs.ErrNetworkNotFound
	case strings.Contains(err.Error(), storage.ErrPrefixUniqueViolation):
		return nil, errs.ErrNetworkAlreadyExists
	default:
		return nil, fmt.Errorf("failed to scan row: %w", err)
	}
}

func (s *Storage) Get(ctx context.Context, id uint64) (*entity.Network, error) {
	queryBuilder := sq.Select("id", "name", "created_at").
		From("networks").
		Where(sq.Eq{"id": id}).
		OrderBy("UPPER(name) ASC")

	query, params, err := queryBuilder.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	row := s.db.GetDB(ctx).QueryRowxContext(ctx, query, params...)

	network := new(entity.Network)
	err = row.StructScan(network)

	switch {
	case err == nil:
		return network, nil
	case errors.Is(err, sql.ErrNoRows):
		return nil, errs.ErrNetworkNotFound
	default:
		return nil, fmt.Errorf("failed to scan row: %w", err)
	}
}

func (s *Storage) List(ctx context.Context, filter *entity.ListNetworkFilter) ([]*entity.Network, error) {
	queryBuilder := sq.Select("id", "name", "created_at").
		From("networks").
		OrderBy("id DESC")

	if filter != nil {
		if len(filter.ID) > 0 {
			queryBuilder = queryBuilder.Where(sq.Like{"id": filter.ID})
		}

		if len(filter.Name) > 0 {
			queryBuilder = queryBuilder.Where(sq.Like{"name": filter.Name})
		}

		if filter.Search != "" {
			queryBuilder = queryBuilder.Where(sq.Like{"name": "%" + filter.Search + "%"})
		}
	}

	query, params, err := queryBuilder.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	rows, err := s.db.GetDB(ctx).QueryxContext(ctx, query, params...)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}
	defer func() {
		if closeErr := rows.Close(); closeErr != nil {
			slog.Error("failed to close rows", "error", closeErr)
		}
	}()

	networks := make([]*entity.Network, 0)
	for rows.Next() {
		network := new(entity.Network)
		err = rows.StructScan(network)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		networks = append(networks, network)
	}

	err = rows.Err()
	if err != nil {
		return nil, fmt.Errorf("got rows error: %w", err)
	}

	return networks, nil
}

func (s *Storage) Delete(ctx context.Context, id uint64) error {
	queryBuilder := sq.Delete("networks").
		Where(sq.Eq{"id": id})

	query, params, err := queryBuilder.ToSql()
	if err != nil {
		return fmt.Errorf("failed to build query: %w", err)
	}

	_, err = s.db.GetDB(ctx).ExecContext(ctx, query, params...)
	if err != nil {
		return fmt.Errorf("failed to exec query: %w", err)
	}

	return nil
}
