package database

import (
	"testing"

	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewTxManager_Success(t *testing.T) {
	db, err := sqlx.Open("sqlite3", ":memory:")
	require.NoError(t, err)
	defer db.Close()

	database := &Database{
		db: db,
	}

	manager, err := NewTxManager(database)
	require.NoError(t, err)
	assert.NotNil(t, manager)
}

func TestNewTxManager_NilDatabase(t *testing.T) {
	database := &Database{
		db: nil,
	}

	manager, err := NewTxManager(database)
	require.NoError(t, err)
	assert.NotNil(t, manager)
}
