package host

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

func (s *Storage) Add(ctx context.Context, host *entity.Host) (*entity.Host, error) {
	queryBuilder := sq.Insert("hosts").
		Columns("address", "description", "created_at").
		Values(host.Address, host.Description, time.Now()).
		Suffix("RETURNING id, address, description, created_at")

	query, params, err := queryBuilder.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	row := s.db.GetDB(ctx).QueryRowxContext(ctx, query, params...)

	newHost := new(entity.Host)
	err = row.StructScan(newHost)

	switch {
	case err == nil:
		return newHost, nil
	case errors.Is(err, sql.ErrNoRows):
		return nil, errs.ErrHostNotFound
	case strings.Contains(err.Error(), storage.ErrPrefixUniqueViolation):
		return nil, errs.ErrHostAlreadyExists
	default:
		return nil, fmt.Errorf("failed to scan row: %w", err)
	}
}

func (s *Storage) List(ctx context.Context, filter *entity.ListHostFilter) ([]*entity.Host, error) {
	queryBuilder := sq.Select("id", "address", "description", "created_at").
		From("hosts").
		OrderBy("UPPER(coalesce(description, address)) ASC")

	if filter != nil {
		if len(filter.ID) > 0 {
			queryBuilder = queryBuilder.Where(sq.Like{"id": filter.ID})
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

	hosts := make([]*entity.Host, 0)
	for rows.Next() {
		host := new(entity.Host)
		err = rows.StructScan(host)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		hosts = append(hosts, host)
	}

	err = rows.Err()
	if err != nil {
		return nil, fmt.Errorf("got rows error: %w", err)
	}

	return hosts, nil
}

func (s *Storage) Delete(ctx context.Context, id uint64) error {
	queryBuilder := sq.Delete("hosts").
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
