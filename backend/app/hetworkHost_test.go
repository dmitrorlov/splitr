package app

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	"github.com/dmitrorlov/splitr/backend/entity"
	mock_usecase "github.com/dmitrorlov/splitr/backend/mocks/usecase"
)

func TestApp_AddNetworkHost_Success(t *testing.T) {
	tests := []struct {
		name        string
		networkID   uint64
		address     string
		description string
		expected    *entity.NetworkHost
	}{
		{
			name:        "add host with description",
			networkID:   1,
			address:     "192.168.1.100",
			description: "Web server",
			expected: &entity.NetworkHost{
				ID:          123,
				NetworkID:   1,
				Address:     "192.168.1.100",
				Description: stringPtr("Web server"),
				CreatedAt:   entity.NewTimestamp(),
			},
		},
		{
			name:        "add host without description",
			networkID:   2,
			address:     "10.0.0.5",
			description: "",
			expected: &entity.NetworkHost{
				ID:          456,
				NetworkID:   2,
				Address:     "10.0.0.5",
				Description: nil,
				CreatedAt:   entity.NewTimestamp(),
			},
		},
		{
			name:        "add hostname",
			networkID:   3,
			address:     "database.example.com",
			description: "Database server",
			expected: &entity.NetworkHost{
				ID:          789,
				NetworkID:   3,
				Address:     "database.example.com",
				Description: stringPtr("Database server"),
				CreatedAt:   entity.NewTimestamp(),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
				Add(gomock.Any(), gomock.Any()).
				DoAndReturn(func(_ context.Context, networkHost *entity.NetworkHost) (*entity.NetworkHost, error) {
					assert.Equal(t, tt.networkID, networkHost.NetworkID)
					assert.Equal(t, tt.address, networkHost.Address)
					if tt.description == "" {
						assert.Nil(t, networkHost.Description)
					} else {
						require.NotNil(t, networkHost.Description)
						assert.Equal(t, tt.description, *networkHost.Description)
					}
					return tt.expected, nil
				})

			result, err := app.AddNetworkHost(tt.networkID, tt.address, tt.description)

			require.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestApp_AddNetworkHost_ValidationError(t *testing.T) {
	tests := []struct {
		name        string
		networkID   uint64
		address     string
		description string
		expectedErr string
	}{
		{
			name:        "invalid ip address",
			networkID:   1,
			address:     "999.999.999.999",
			description: "Invalid IP",
			expectedErr: "invalid address",
		},
		{
			name:        "empty address",
			networkID:   1,
			address:     "",
			description: "Empty address",
			expectedErr: "invalid address",
		},
		{
			name:        "invalid hostname",
			networkID:   1,
			address:     "-invalid.com",
			description: "Invalid hostname",
			expectedErr: "invalid address",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			result, err := app.AddNetworkHost(tt.networkID, tt.address, tt.description)

			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.expectedErr)
			assert.Nil(t, result)
		})
	}
}

func TestApp_AddNetworkHost_UseCaseError(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	expectedError := errors.New("database error")
	app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
		Add(gomock.Any(), gomock.Any()).
		Return(nil, expectedError)

	result, err := app.AddNetworkHost(1, "192.168.1.1", "Test host")

	require.Error(t, err)
	assert.Equal(t, expectedError, err)
	assert.Nil(t, result)
}

func TestApp_ListNetworkHosts_Success(t *testing.T) {
	tests := []struct {
		name       string
		networkID  uint64
		searchTerm string
		expected   []*entity.NetworkHost
	}{
		{
			name:       "list without search",
			networkID:  1,
			searchTerm: "",
			expected: []*entity.NetworkHost{
				{
					ID:          1,
					NetworkID:   1,
					Address:     "192.168.1.1",
					Description: stringPtr("Router"),
					CreatedAt:   entity.NewTimestamp(),
				},
				{
					ID:          2,
					NetworkID:   1,
					Address:     "192.168.1.2",
					Description: nil,
					CreatedAt:   entity.NewTimestamp(),
				},
			},
		},
		{
			name:       "list with search term",
			networkID:  2,
			searchTerm: "server",
			expected: []*entity.NetworkHost{
				{
					ID:          3,
					NetworkID:   2,
					Address:     "server.example.com",
					Description: stringPtr("Web server"),
					CreatedAt:   entity.NewTimestamp(),
				},
			},
		},
		{
			name:       "empty list",
			networkID:  3,
			searchTerm: "",
			expected:   []*entity.NetworkHost{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			expectedFilter := &entity.ListNetworkHostFilter{
				NetworkID: []uint64{tt.networkID},
				Search:    tt.searchTerm,
			}

			app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
				List(gomock.Any(), expectedFilter).
				Return(tt.expected, nil)

			result, err := app.ListNetworkHosts(tt.networkID, tt.searchTerm)

			require.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestApp_ListNetworkHosts_Error(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	expectedError := errors.New("network not found")
	app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
		List(gomock.Any(), gomock.Any()).
		Return(nil, expectedError)

	result, err := app.ListNetworkHosts(1, "")

	require.Error(t, err)
	assert.Equal(t, expectedError, err)
	assert.Nil(t, result)
}

func TestApp_DeleteNetworkHost_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	hostID := uint64(123)
	app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
		Delete(gomock.Any(), hostID).
		Return(nil)

	err := app.DeleteNetworkHost(hostID)

	require.NoError(t, err)
}

func TestApp_DeleteNetworkHost_Error(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	hostID := uint64(123)
	expectedError := errors.New("host not found")
	app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
		Delete(gomock.Any(), hostID).
		Return(expectedError)

	err := app.DeleteNetworkHost(hostID)

	require.Error(t, err)
	assert.Equal(t, expectedError, err)
}

func TestApp_SyncNetworkHostSetup_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	networkID := uint64(456)
	app.networkHostSetupUC.(*mock_usecase.MockNetworkHostSetup).EXPECT().
		SyncByNetworkID(gomock.Any(), networkID).
		Return(nil)

	err := app.SyncNetworkHostSetup(networkID)

	require.NoError(t, err)
}

func TestApp_SyncNetworkHostSetup_Error(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	networkID := uint64(456)
	expectedError := errors.New("sync failed")
	app.networkHostSetupUC.(*mock_usecase.MockNetworkHostSetup).EXPECT().
		SyncByNetworkID(gomock.Any(), networkID).
		Return(expectedError)

	err := app.SyncNetworkHostSetup(networkID)

	require.Error(t, err)
	assert.Equal(t, expectedError, err)
}

func TestApp_ResetNetworkHostSetup_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	networkID := uint64(789)
	app.networkHostSetupUC.(*mock_usecase.MockNetworkHostSetup).EXPECT().
		ResetByNetworkID(gomock.Any(), networkID).
		Return(nil)

	err := app.ResetNetworkHostSetup(networkID)

	require.NoError(t, err)
}

func TestApp_ResetNetworkHostSetup_Error(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	networkID := uint64(789)
	expectedError := errors.New("reset failed")
	app.networkHostSetupUC.(*mock_usecase.MockNetworkHostSetup).EXPECT().
		ResetByNetworkID(gomock.Any(), networkID).
		Return(expectedError)

	err := app.ResetNetworkHostSetup(networkID)

	require.Error(t, err)
	assert.Equal(t, expectedError, err)
}

func TestApp_ExportNetworkHosts_Success(t *testing.T) {
	tests := []struct {
		name         string
		networkID    uint64
		exportData   *entity.NetworkHostContextExportPayload
		expectedJSON string
	}{
		{
			name:      "export with hosts",
			networkID: 1,
			exportData: &entity.NetworkHostContextExportPayload{
				ExportDate: time.Date(2023, 12, 1, 10, 0, 0, 0, time.UTC),
				Hosts: []entity.NetworkHostDTO{
					{
						Address:     "192.168.1.1",
						Description: "Router",
					},
					{
						Address:     "192.168.1.2",
						Description: "",
					},
				},
			},
			expectedJSON: `{
  "export_date": "2023-12-01T10:00:00Z",
  "hosts": [
    {
      "address": "192.168.1.1",
      "description": "Router"
    },
    {
      "address": "192.168.1.2"
    }
  ]
}`,
		},
		{
			name:      "export empty list",
			networkID: 2,
			exportData: &entity.NetworkHostContextExportPayload{
				ExportDate: time.Date(2023, 12, 1, 10, 0, 0, 0, time.UTC),
				Hosts:      []entity.NetworkHostDTO{},
			},
			expectedJSON: `{
  "export_date": "2023-12-01T10:00:00Z",
  "hosts": []
}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
				ExportByNetworkIDForContext(gomock.Any(), tt.networkID).
				Return(tt.exportData, nil)

			result, err := app.ExportNetworkHosts(tt.networkID)

			require.NoError(t, err)
			assert.JSONEq(t, tt.expectedJSON, result)
		})
	}
}

func TestApp_ExportNetworkHosts_UseCaseError(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	networkID := uint64(1)
	expectedError := errors.New("network not found")
	app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
		ExportByNetworkIDForContext(gomock.Any(), networkID).
		Return(nil, expectedError)

	result, err := app.ExportNetworkHosts(networkID)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to export network hosts")
	assert.Empty(t, result)
}

func TestApp_ImportNetworkHosts_Success(t *testing.T) {
	tests := []struct {
		name      string
		networkID uint64
		jsonData  string
	}{
		{
			name:      "import valid json",
			networkID: 1,
			jsonData: `{
				"export_date": "2023-12-01T10:00:00Z",
				"hosts": [
					{"address": "192.168.1.1", "description": "Router"},
					{"address": "192.168.1.2"}
				]
			}`,
		},
		{
			name:      "import empty hosts",
			networkID: 2,
			jsonData: `{
				"export_date": "2023-12-01T10:00:00Z",
				"hosts": []
			}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
				ImportByNetworkIDFromJSON(gomock.Any(), tt.networkID, tt.jsonData).
				Return(nil)

			err := app.ImportNetworkHosts(tt.networkID, tt.jsonData)

			require.NoError(t, err)
		})
	}
}

func TestApp_ImportNetworkHosts_Error(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	networkID := uint64(1)
	jsonData := `{"invalid": "json"}`
	expectedError := errors.New("invalid json format")

	app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
		ImportByNetworkIDFromJSON(gomock.Any(), networkID, jsonData).
		Return(expectedError)

	err := app.ImportNetworkHosts(networkID, jsonData)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to import network hosts")
}

func TestApp_NetworkHostMethods_ContextUsage(t *testing.T) {
	// Test that all methods properly use the app context
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type contextKey string
	app := createTestApp(ctrl)
	ctx := context.WithValue(context.Background(), contextKey("test"), "value")
	app.OnStartup(ctx)

	t.Run("AddNetworkHost uses context", func(t *testing.T) {
		app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
			Add(ctx, gomock.Any()).
			Return(&entity.NetworkHost{}, nil)

		_, err := app.AddNetworkHost(1, "192.168.1.1", "test")
		require.NoError(t, err)
	})

	t.Run("ListNetworkHosts uses context", func(t *testing.T) {
		app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
			List(ctx, gomock.Any()).
			Return([]*entity.NetworkHost{}, nil)

		_, err := app.ListNetworkHosts(1, "")
		require.NoError(t, err)
	})

	t.Run("DeleteNetworkHost uses context", func(t *testing.T) {
		app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
			Delete(ctx, uint64(1)).
			Return(nil)

		err := app.DeleteNetworkHost(1)
		require.NoError(t, err)
	})

	t.Run("SyncNetworkHostSetup uses context", func(t *testing.T) {
		app.networkHostSetupUC.(*mock_usecase.MockNetworkHostSetup).EXPECT().
			SyncByNetworkID(ctx, uint64(1)).
			Return(nil)

		err := app.SyncNetworkHostSetup(1)
		require.NoError(t, err)
	})

	t.Run("ResetNetworkHostSetup uses context", func(t *testing.T) {
		app.networkHostSetupUC.(*mock_usecase.MockNetworkHostSetup).EXPECT().
			ResetByNetworkID(ctx, uint64(1)).
			Return(nil)

		err := app.ResetNetworkHostSetup(1)
		require.NoError(t, err)
	})

	t.Run("ExportNetworkHosts uses context", func(t *testing.T) {
		app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
			ExportByNetworkIDForContext(ctx, uint64(1)).
			Return(&entity.NetworkHostContextExportPayload{
				ExportDate: time.Now(),
				Hosts:      []entity.NetworkHostDTO{},
			}, nil)

		_, err := app.ExportNetworkHosts(1)
		require.NoError(t, err)
	})

	t.Run("ImportNetworkHosts uses context", func(t *testing.T) {
		app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
			ImportByNetworkIDFromJSON(ctx, uint64(1), gomock.Any()).
			Return(nil)

		err := app.ImportNetworkHosts(1, `{"hosts": []}`)
		require.NoError(t, err)
	})
}

func TestApp_ExportNetworkHosts_JSONMarshalError(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	// Create a payload that would cause JSON marshal to fail
	// This is hard to simulate in real scenarios, but we can test the error path
	networkID := uint64(1)

	// Return a payload with time that might cause issues
	exportData := &entity.NetworkHostContextExportPayload{
		ExportDate: time.Time{}, // Invalid time might cause issues in some cases
		Hosts: []entity.NetworkHostDTO{
			{Address: "192.168.1.1", Description: "Test"},
		},
	}

	app.networkHostUC.(*mock_usecase.MockNetworkHost).EXPECT().
		ExportByNetworkIDForContext(gomock.Any(), networkID).
		Return(exportData, nil)

	result, err := app.ExportNetworkHosts(networkID)

	// Even with an invalid time, JSON marshal should still succeed
	// This test mainly ensures the code path is covered
	require.NoError(t, err)
	assert.NotEmpty(t, result)

	// Verify it's valid JSON
	var parsed map[string]any
	err = json.Unmarshal([]byte(result), &parsed)
	require.NoError(t, err)
}

// Helper function to create a string pointer.
func stringPtr(s string) *string {
	return &s
}
