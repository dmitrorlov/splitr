package networkhost

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

func (s *Storage) Add(ctx context.Context, networkHost *entity.NetworkHost) (*entity.NetworkHost, error) {
	queryBuilder := sq.Insert("network_hosts").
		Columns("network_id", "address", "description", "created_at").
		Values(networkHost.NetworkID, networkHost.Address, networkHost.Description, time.Now()).
		Suffix("RETURNING id, network_id, address, description, created_at")

	query, params, err := queryBuilder.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	row := s.db.GetDB(ctx).QueryRowxContext(ctx, query, params...)

	newNetworkHost := new(entity.NetworkHost)
	err = row.StructScan(newNetworkHost)

	switch {
	case err == nil:
		return newNetworkHost, nil
	case errors.Is(err, sql.ErrNoRows):
		return nil, errs.ErrNetworkHostNotFound
	case strings.Contains(err.Error(), storage.ErrPrefixUniqueViolation):
		return nil, errs.ErrNetworkHostAlreadyExists
	case strings.Contains(err.Error(), storage.ErrPrefixForeignKeyViolation):
		return nil, errs.ErrNetworkNotFound
	default:
		return nil, fmt.Errorf("failed to scan row: %w", err)
	}
}

func (s *Storage) Get(ctx context.Context, id uint64) (*entity.NetworkHost, error) {
	queryBuilder := sq.Select("id", "network_id", "address", "description", "created_at").
		From("network_hosts").
		Where(sq.Eq{"id": id})

	query, params, err := queryBuilder.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	row := s.db.GetDB(ctx).QueryRowxContext(ctx, query, params...)

	networkHost := new(entity.NetworkHost)
	err = row.StructScan(networkHost)

	switch {
	case err == nil:
		return networkHost, nil
	case errors.Is(err, sql.ErrNoRows):
		return nil, errs.ErrNetworkHostNotFound
	default:
		return nil, fmt.Errorf("failed to scan row: %w", err)
	}
}

func (s *Storage) List(ctx context.Context, filter *entity.ListNetworkHostFilter) ([]*entity.NetworkHost, error) {
	queryBuilder := sq.Select("id", "network_id", "address", "description", "created_at").
		From("network_hosts").
		OrderBy("UPPER(coalesce(description, address)) ASC")

	if filter != nil {
		if filter.ID != nil {
			queryBuilder = queryBuilder.Where(sq.Eq{"id": filter.ID})
		}

		if filter.NetworkID != nil {
			queryBuilder = queryBuilder.Where(sq.Eq{"network_id": filter.NetworkID})
		}

		if filter.Address != nil {
			queryBuilder = queryBuilder.Where(sq.Eq{"address": filter.Address})
		}

		if filter.Search != "" {
			searchTerm := strings.ToUpper(fmt.Sprintf("%%%s%%", filter.Search))
			queryBuilder = queryBuilder.Where(
				sq.Or{
					sq.Like{"UPPER(address)": searchTerm},
					sq.Like{"UPPER(description)": searchTerm},
				},
			)
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

	var networkHosts []*entity.NetworkHost
	for rows.Next() {
		networkHost := new(entity.NetworkHost)
		err = rows.StructScan(networkHost)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		networkHosts = append(networkHosts, networkHost)
	}

	err = rows.Err()
	if err != nil {
		return nil, fmt.Errorf("got rows error: %w", err)
	}

	return networkHosts, nil
}

func (s *Storage) Delete(ctx context.Context, id uint64) error {
	queryBuilder := sq.Delete("network_hosts").
		Where(sq.Eq{"id": id})

	query, params, err := queryBuilder.ToSql()
	if err != nil {
		return fmt.Errorf("failed to build query: %w", err)
	}

	_, err = s.db.GetDB(ctx).ExecContext(ctx, query, params...)
	if err != nil {
		return fmt.Errorf("failed to execute query: %w", err)
	}

	return nil
}
