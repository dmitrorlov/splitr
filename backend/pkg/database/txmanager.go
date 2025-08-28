package database

import (
	"fmt"

	"github.com/avito-tech/go-transaction-manager/drivers/sqlx/v2"
	"github.com/avito-tech/go-transaction-manager/trm/v2/manager"
)

func NewTxManager(db *Database) (*manager.Manager, error) {
	m, err := manager.New(sqlx.NewDefaultFactory(db.db))
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction manager: %w", err)
	}

	return m, nil
}
