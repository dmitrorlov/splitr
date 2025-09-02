package host

import (
	"context"
	"log/slog"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/dmitrorlov/splitr/backend/entity"
	"github.com/dmitrorlov/splitr/backend/pkg/database"
	"github.com/dmitrorlov/splitr/backend/pkg/errs"
)

func TestMain(m *testing.M) {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
		Level: slog.LevelError,
	})))

	os.Exit(m.Run())
}

func setupTestDB(t *testing.T) *database.Database {
	t.Helper()

	testDB, err := database.NewForTesting("splitr_host_test")
	require.NoError(t, err)
	t.Cleanup(func() {
		testDB.Close()
	})

	ctx := context.Background()

	// Clean up any existing hosts table and recreate it
	_, _ = testDB.GetDB(ctx).ExecContext(ctx, "DROP VIEW IF EXISTS hosts")
	_, _ = testDB.GetDB(ctx).ExecContext(ctx, "DROP TABLE IF EXISTS hosts")

	_, err = testDB.GetDB(ctx).ExecContext(ctx, `
		CREATE TABLE hosts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			address TEXT NOT NULL UNIQUE,
			description TEXT,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
	`)
	require.NoError(t, err)

	return testDB
}

func TestNew(t *testing.T) {
	db := setupTestDB(t)

	storage := New(db)

	assert.NotNil(t, storage)
	assert.Equal(t, db, storage.db)
}

func TestStorage_Add_Success(t *testing.T) {
	db := setupTestDB(t)
	storage := New(db)
	ctx := context.Background()

	tests := []struct {
		name     string
		host     *entity.Host
		expected func(*entity.Host)
	}{
		{
			name: "add host with description",
			host: &entity.Host{
				Address:     "192.168.1.100",
				Description: stringPtr("Web server"),
			},
			expected: func(result *entity.Host) {
				assert.Equal(t, "192.168.1.100", result.Address)
				assert.NotNil(t, result.Description)
				assert.Equal(t, "Web server", *result.Description)
				assert.Positive(t, result.ID)
				assert.False(t, result.CreatedAt.IsZero())
			},
		},
		{
			name: "add host without description",
			host: &entity.Host{
				Address: "example.com",
			},
			expected: func(result *entity.Host) {
				assert.Equal(t, "example.com", result.Address)
				assert.Nil(t, result.Description)
				assert.Positive(t, result.ID)
				assert.False(t, result.CreatedAt.IsZero())
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := storage.Add(ctx, tt.host)

			require.NoError(t, err)
			require.NotNil(t, result)
			tt.expected(result)
		})
	}
}

func TestStorage_Add_UniqueConstraintViolation(t *testing.T) {
	db := setupTestDB(t)
	storage := New(db)
	ctx := context.Background()

	host1 := &entity.Host{
		Address: "duplicate.com",
	}

	_, err := storage.Add(ctx, host1)
	require.NoError(t, err)

	host2 := &entity.Host{
		Address: "duplicate.com",
	}

	result, err := storage.Add(ctx, host2)

	require.Error(t, err)
	assert.Nil(t, result)
	assert.Equal(t, errs.ErrHostAlreadyExists, err)
}

func TestStorage_List_Success(t *testing.T) {
	db := setupTestDB(t)
	storage := New(db)
	ctx := context.Background()

	seedHosts := []*entity.Host{
		{Address: "192.168.1.1", Description: stringPtr("Router")},
		{Address: "192.168.1.100", Description: stringPtr("Web Server")},
		{Address: "example.com"},
		{Address: "test.local", Description: stringPtr("Test Host")},
	}

	for _, host := range seedHosts {
		_, err := storage.Add(ctx, host)
		require.NoError(t, err)
	}

	tests := []struct {
		name           string
		filter         *entity.ListHostFilter
		expectedCount  int
		validateResult func([]*entity.Host)
	}{
		{
			name:          "list all with nil filter",
			filter:        nil,
			expectedCount: 4,
			validateResult: func(hosts []*entity.Host) {
				addresses := make([]string, len(hosts))
				for i, h := range hosts {
					addresses[i] = h.Address
				}
				assert.Contains(t, addresses, "192.168.1.1")
				assert.Contains(t, addresses, "192.168.1.100")
				assert.Contains(t, addresses, "example.com")
				assert.Contains(t, addresses, "test.local")
			},
		},
		{
			name:          "list all with empty filter",
			filter:        &entity.ListHostFilter{},
			expectedCount: 4,
			validateResult: func(hosts []*entity.Host) {
				assert.Len(t, hosts, 4)
			},
		},
		{
			name: "filter by search term matching address",
			filter: &entity.ListHostFilter{
				Search: "192.168",
			},
			expectedCount: 2,
			validateResult: func(hosts []*entity.Host) {
				for _, host := range hosts {
					assert.Contains(t, strings.ToUpper(host.Address), strings.ToUpper("192.168"))
				}
			},
		},
		{
			name: "filter by search term matching description",
			filter: &entity.ListHostFilter{
				Search: "server",
			},
			expectedCount: 1,
			validateResult: func(hosts []*entity.Host) {
				assert.Equal(t, "192.168.1.100", hosts[0].Address)
			},
		},
		{
			name: "filter by search term case insensitive",
			filter: &entity.ListHostFilter{
				Search: "WEB",
			},
			expectedCount: 1,
			validateResult: func(hosts []*entity.Host) {
				assert.Equal(t, "192.168.1.100", hosts[0].Address)
			},
		},
		{
			name: "filter with no matching results",
			filter: &entity.ListHostFilter{
				Search: "nonexistent",
			},
			expectedCount: 0,
			validateResult: func(hosts []*entity.Host) {
				assert.Empty(t, hosts)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := storage.List(ctx, tt.filter)

			require.NoError(t, err)
			assert.Len(t, result, tt.expectedCount)

			if tt.validateResult != nil {
				tt.validateResult(result)
			}
		})
	}
}

func TestStorage_Delete_Success(t *testing.T) {
	db := setupTestDB(t)
	storage := New(db)
	ctx := context.Background()

	host := &entity.Host{
		Address: "to-be-deleted.com",
	}

	added, err := storage.Add(ctx, host)
	require.NoError(t, err)

	err = storage.Delete(ctx, added.ID)
	require.NoError(t, err)

	hosts, err := storage.List(ctx, nil)
	require.NoError(t, err)

	for _, h := range hosts {
		assert.NotEqual(t, added.ID, h.ID)
	}
}

func TestStorage_Delete_NonExistentID(t *testing.T) {
	db := setupTestDB(t)
	storage := New(db)
	ctx := context.Background()

	err := storage.Delete(ctx, 99999)
	assert.NoError(t, err)
}

func TestStorage_List_WithIDFilter_QueryBuildError(t *testing.T) {
	db := setupTestDB(t)
	storage := New(db)
	ctx := context.Background()

	filter := &entity.ListHostFilter{
		ID: []uint64{1, 2, 3},
	}

	_, err := storage.List(ctx, filter)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to build query")
	assert.Contains(t, err.Error(), "cannot use array or slice with like operators")
}

func TestStorage_List_DatabaseError(t *testing.T) {
	db := setupTestDB(t)
	storage := New(db)
	ctx := context.Background()

	ctx, cancel := context.WithCancel(ctx)
	cancel()

	_, err := storage.List(ctx, nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to execute query")
}

func TestStorage_List_RowScanError(t *testing.T) {
	db := setupTestDB(t)
	storage := New(db)
	ctx := context.Background()

	// Create a table with incompatible column types that will cause scan errors
	_, err := db.GetDB(ctx).ExecContext(ctx, `
		DROP TABLE IF EXISTS hosts;
		CREATE TABLE hosts (
			id TEXT, -- This should be INTEGER
			address TEXT NOT NULL UNIQUE,
			description TEXT,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		INSERT INTO hosts (id, address, description, created_at) VALUES ('not-a-number', 'test.com', 'desc', '2023-01-01');
	`)
	require.NoError(t, err)

	_, err = storage.List(ctx, nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to scan row")
}

func TestStorage_Delete_DatabaseError(t *testing.T) {
	db := setupTestDB(t)
	storage := New(db)
	ctx := context.Background()

	_, err := db.GetDB(ctx).ExecContext(ctx, "DROP TABLE hosts")
	require.NoError(t, err)

	err = storage.Delete(ctx, 1)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to exec query")
}

func TestStorage_Add_DatabaseScanError(t *testing.T) {
	db := setupTestDB(t)
	storage := New(db)
	ctx := context.Background()

	_, err := db.GetDB(ctx).ExecContext(ctx, "DROP TABLE hosts")
	require.NoError(t, err)

	host := &entity.Host{
		Address: "test.com",
	}

	_, err = storage.Add(ctx, host)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to scan row")
}

func TestStorage_List_RowsError(t *testing.T) {
	db := setupTestDB(t)
	storage := New(db)
	ctx := context.Background()

	// Add a host and then corrupt the database connection
	host := &entity.Host{
		Address: "test.com",
	}
	_, err := storage.Add(ctx, host)
	require.NoError(t, err)

	// Close the database connection to simulate rows.Err() returning error
	err = db.Close()
	require.NoError(t, err)

	// This should trigger error in rows.Err() check
	_, err = storage.List(ctx, nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to execute query")
}

func stringPtr(s string) *string {
	return &s
}
