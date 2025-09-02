package database

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"os"
	"time"

	trmSqlx "github.com/avito-tech/go-transaction-manager/drivers/sqlx/v2"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite3" //nolint:blank-imports // Required for migrate
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3" //nolint:blank-imports // Required for sqlite3
)

const (
	driverName = "sqlite3"

	defaultDBConnectionAttempts = 10
)

type Database struct {
	db        *sqlx.DB
	ctxGetter *trmSqlx.CtxGetter
}

type pathGetter func(string) (string, error)

// New creates a new database connection and applies migrations.
func New(appName string, migrationsFS embed.FS) (*Database, error) {
	return newDatabaseWithPathGetter(appName, &migrationsFS, getMacOSAppDataPath)
}

// NewForTesting creates a database connection without applying migrations
// This is useful for testing against an existing database.
func NewForTesting(appName string) (*Database, error) {
	return newDatabaseWithPathGetter(appName, nil, getMacOSAppDataPath)
}

func newDatabaseWithPathGetter(appName string, migrationsFS *embed.FS, getPath pathGetter) (*Database, error) {
	sourcePath, err := getPath(appName)
	if err != nil {
		return nil, fmt.Errorf("failed to get macOS app data path: %w", err)
	}

	err = os.MkdirAll(sourcePath, 0o750)
	if err != nil {
		return nil, fmt.Errorf("failed to create app data directory: %w", err)
	}

	source := fmt.Sprintf("%s/%s.db", sourcePath, appName)
	slog.Info("connecting", "source", source)

	if _, statErr := os.Stat(source); os.IsNotExist(statErr) {
		file, createErr := os.Create(source)
		if createErr != nil {
			return nil, fmt.Errorf("failed to create database file: %w", createErr)
		}
		if closeErr := file.Close(); closeErr != nil {
			return nil, fmt.Errorf("failed to close database file: %w", closeErr)
		}
	}

	rawDB, err := sqlx.Connect(driverName, source)
	if err != nil {
		return nil, err
	}

	db := &Database{
		db:        rawDB,
		ctxGetter: trmSqlx.DefaultCtxGetter,
	}

	err = db.checkConnection()
	if err != nil {
		return nil, fmt.Errorf("failed to establish connection to db: %w", err)
	}

	if migrationsFS != nil {
		err = db.applySchema(source, *migrationsFS)
		if err != nil {
			return nil, fmt.Errorf("failed to apply schema: %w", err)
		}
	}

	_, err = rawDB.Exec("PRAGMA foreign_keys = ON;")
	if err != nil {
		return nil, fmt.Errorf("failed to enable foreign keys: %w", err)
	}

	return db, nil
}

func (d *Database) checkConnection() error {
	var err error
	for range defaultDBConnectionAttempts {
		if err = d.db.Ping(); err != nil {
			err = fmt.Errorf("failed to create connection: %w", err)
			time.Sleep(time.Second)
			continue
		}
		break
	}

	return err
}

func (d *Database) applySchema(sourcePath string, migrationsFS embed.FS) error {
	dbPath := fmt.Sprintf("sqlite3://file:%s", sourcePath)
	if _, err := os.Stat(sourcePath); os.IsNotExist(err) {
		return fmt.Errorf("database file does not exist at path: %s", sourcePath)
	}

	migrations, err := fs.Sub(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("failed to get migrations subdirectory: %w", err)
	}

	sourceInstance, err := iofs.New(migrations, ".")
	if err != nil {
		return fmt.Errorf("failed to create source instance from embedded migrations: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", sourceInstance, dbPath)
	if err != nil {
		return fmt.Errorf("failed to create migration db instance: %w", err)
	}

	err = m.Up()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	return nil
}

func (d *Database) GetDB(ctx context.Context) trmSqlx.Tr {
	return d.ctxGetter.DefaultTrOrDB(ctx, d.db)
}

func (d *Database) Close() error {
	return d.db.Close()
}
