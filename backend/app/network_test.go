package app

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	"github.com/dmitrorlov/splitr/backend/entity"
	mock_usecase "github.com/dmitrorlov/splitr/backend/mocks/usecase"
)

func TestApp_AddNetwork_Success(t *testing.T) {
	tests := []struct {
		name         string
		networkName  string
		expectedName string
		expected     *entity.Network
	}{
		{
			name:         "add network with standard name",
			networkName:  "Home Network",
			expectedName: "Home Network",
			expected: &entity.Network{
				ID:        123,
				Name:      "Home Network",
				CreatedAt: entity.NewTimestamp(),
			},
		},
		{
			name:         "add network with single word name",
			networkName:  "Office",
			expectedName: "Office",
			expected: &entity.Network{
				ID:        456,
				Name:      "Office",
				CreatedAt: entity.NewTimestamp(),
			},
		},
		{
			name:         "add network with numbers and special chars",
			networkName:  "Network-123_VPN",
			expectedName: "Network-123_VPN",
			expected: &entity.Network{
				ID:        789,
				Name:      "Network-123_VPN",
				CreatedAt: entity.NewTimestamp(),
			},
		},
		{
			name:         "add network with empty name",
			networkName:  "",
			expectedName: "",
			expected: &entity.Network{
				ID:        100,
				Name:      "",
				CreatedAt: entity.NewTimestamp(),
			},
		},
		{
			name:         "add network with very long name",
			networkName:  "Very Long Network Name That Might Test Database Field Limits And System Behavior With Extended Text Input",
			expectedName: "Very Long Network Name That Might Test Database Field Limits And System Behavior With Extended Text Input",
			expected: &entity.Network{
				ID:        200,
				Name:      "Very Long Network Name That Might Test Database Field Limits And System Behavior With Extended Text Input",
				CreatedAt: entity.NewTimestamp(),
			},
		},
		{
			name:         "add network with unicode characters",
			networkName:  "网络 🌐 Network",
			expectedName: "网络 🌐 Network",
			expected: &entity.Network{
				ID:        300,
				Name:      "网络 🌐 Network",
				CreatedAt: entity.NewTimestamp(),
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
				Add(gomock.Any(), gomock.Any()).
				DoAndReturn(func(_ context.Context, network *entity.Network) (*entity.Network, error) {
					assert.Equal(t, tt.expectedName, network.Name)
					assert.Equal(t, uint64(0), network.ID) // ID should be 0 for new network
					return tt.expected, nil
				})

			result, err := app.AddNetwork(tt.networkName)

			require.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestApp_AddNetwork_UseCaseError(t *testing.T) {
	tests := []struct {
		name         string
		networkName  string
		expectedErr  error
		errorMessage string
	}{
		{
			name:         "database connection error",
			networkName:  "Test Network",
			expectedErr:  errors.New("database connection failed"),
			errorMessage: "database connection failed",
		},
		{
			name:         "network already exists",
			networkName:  "Existing Network",
			expectedErr:  errors.New("network already exists"),
			errorMessage: "network already exists",
		},
		{
			name:         "validation error",
			networkName:  "Invalid Network",
			expectedErr:  errors.New("invalid network name"),
			errorMessage: "invalid network name",
		},
		{
			name:         "permission denied",
			networkName:  "Admin Network",
			expectedErr:  errors.New("insufficient permissions"),
			errorMessage: "insufficient permissions",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
				Add(gomock.Any(), gomock.Any()).
				Return(nil, tt.expectedErr)

			result, err := app.AddNetwork(tt.networkName)

			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.errorMessage)
			assert.Nil(t, result)
		})
	}
}

func TestApp_ListNetworks_Success(t *testing.T) {
	tests := []struct {
		name       string
		searchTerm string
		expected   []*entity.NetworkWithStatus
	}{
		{
			name:       "list without search",
			searchTerm: "",
			expected: []*entity.NetworkWithStatus{
				{
					Network: entity.Network{
						ID:        1,
						Name:      "Home Network",
						CreatedAt: entity.NewTimestamp(),
					},
					IsActive: true,
				},
				{
					Network: entity.Network{
						ID:        2,
						Name:      "Office Network",
						CreatedAt: entity.NewTimestamp(),
					},
					IsActive: false,
				},
				{
					Network: entity.Network{
						ID:        3,
						Name:      "VPN Network",
						CreatedAt: entity.NewTimestamp(),
					},
					IsActive: true,
				},
			},
		},
		{
			name:       "list with search term",
			searchTerm: "Office",
			expected: []*entity.NetworkWithStatus{
				{
					Network: entity.Network{
						ID:        2,
						Name:      "Office Network",
						CreatedAt: entity.NewTimestamp(),
					},
					IsActive: false,
				},
			},
		},
		{
			name:       "list with partial search",
			searchTerm: "Network",
			expected: []*entity.NetworkWithStatus{
				{
					Network: entity.Network{
						ID:        1,
						Name:      "Home Network",
						CreatedAt: entity.NewTimestamp(),
					},
					IsActive: true,
				},
				{
					Network: entity.Network{
						ID:        2,
						Name:      "Office Network",
						CreatedAt: entity.NewTimestamp(),
					},
					IsActive: false,
				},
				{
					Network: entity.Network{
						ID:        3,
						Name:      "VPN Network",
						CreatedAt: entity.NewTimestamp(),
					},
					IsActive: true,
				},
			},
		},
		{
			name:       "empty search results",
			searchTerm: "nonexistent",
			expected:   []*entity.NetworkWithStatus{},
		},
		{
			name:       "empty list",
			searchTerm: "",
			expected:   []*entity.NetworkWithStatus{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			expectedFilter := &entity.ListNetworkFilter{Search: tt.searchTerm}

			app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
				List(gomock.Any(), expectedFilter).
				Return(tt.expected, nil)

			result, err := app.ListNetworks(tt.searchTerm)

			require.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestApp_ListNetworks_Error(t *testing.T) {
	tests := []struct {
		name         string
		searchTerm   string
		expectedErr  error
		errorMessage string
	}{
		{
			name:         "database connection error",
			searchTerm:   "",
			expectedErr:  errors.New("database connection failed"),
			errorMessage: "database connection failed",
		},
		{
			name:         "query timeout",
			searchTerm:   "timeout",
			expectedErr:  errors.New("query timeout exceeded"),
			errorMessage: "query timeout exceeded",
		},
		{
			name:         "permission denied",
			searchTerm:   "restricted",
			expectedErr:  errors.New("access denied"),
			errorMessage: "access denied",
		},
		{
			name:         "invalid search parameter",
			searchTerm:   "invalid-chars-!@#$",
			expectedErr:  errors.New("invalid search parameter"),
			errorMessage: "invalid search parameter",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
				List(gomock.Any(), gomock.Any()).
				Return(nil, tt.expectedErr)

			result, err := app.ListNetworks(tt.searchTerm)

			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.errorMessage)
			assert.Nil(t, result)
		})
	}
}

func TestApp_DeleteNetwork_Success(t *testing.T) {
	tests := []struct {
		name      string
		networkID uint64
	}{
		{
			name:      "delete existing network",
			networkID: 123,
		},
		{
			name:      "delete network with ID 1",
			networkID: 1,
		},
		{
			name:      "delete network with large ID",
			networkID: 999999,
		},
		{
			name:      "delete network with ID 0",
			networkID: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
				Delete(gomock.Any(), tt.networkID).
				Return(nil)

			err := app.DeleteNetwork(tt.networkID)

			require.NoError(t, err)
		})
	}
}

func TestApp_DeleteNetwork_Error(t *testing.T) {
	tests := []struct {
		name         string
		networkID    uint64
		expectedErr  error
		errorMessage string
	}{
		{
			name:         "network not found",
			networkID:    123,
			expectedErr:  errors.New("network not found"),
			errorMessage: "network not found",
		},
		{
			name:         "database error",
			networkID:    456,
			expectedErr:  errors.New("database connection failed"),
			errorMessage: "database connection failed",
		},
		{
			name:         "foreign key constraint",
			networkID:    789,
			expectedErr:  errors.New("network is referenced by hosts"),
			errorMessage: "network is referenced by hosts",
		},
		{
			name:         "network in use",
			networkID:    100,
			expectedErr:  errors.New("network is currently active"),
			errorMessage: "network is currently active",
		},
		{
			name:         "permission denied",
			networkID:    200,
			expectedErr:  errors.New("insufficient permissions to delete network"),
			errorMessage: "insufficient permissions to delete network",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
				Delete(gomock.Any(), tt.networkID).
				Return(tt.expectedErr)

			err := app.DeleteNetwork(tt.networkID)

			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.errorMessage)
		})
	}
}

func TestApp_ListVPNServices_Success(t *testing.T) {
	tests := []struct {
		name     string
		expected []entity.VPNService
	}{
		{
			name: "list vpn services",
			expected: []entity.VPNService{
				"OpenVPN",
				"WireGuard",
				"IKEv2",
			},
		},
		{
			name:     "empty vpn services list",
			expected: []entity.VPNService{},
		},
		{
			name: "single vpn service",
			expected: []entity.VPNService{
				"ExpressVPN",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
				ListVPNServices(gomock.Any()).
				Return(tt.expected, nil)

			result, err := app.ListVPNServices()

			require.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestApp_ListVPNServices_Error(t *testing.T) {
	tests := []struct {
		name         string
		expectedErr  error
		errorMessage string
	}{
		{
			name:         "system command error",
			expectedErr:  errors.New("failed to execute system command"),
			errorMessage: "failed to execute system command",
		},
		{
			name:         "permission denied",
			expectedErr:  errors.New("permission denied to list VPN services"),
			errorMessage: "permission denied to list VPN services",
		},
		{
			name:         "vpn service not available",
			expectedErr:  errors.New("VPN services not available on this system"),
			errorMessage: "VPN services not available on this system",
		},
		{
			name:         "timeout error",
			expectedErr:  errors.New("timeout while listing VPN services"),
			errorMessage: "timeout while listing VPN services",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
				ListVPNServices(gomock.Any()).
				Return(nil, tt.expectedErr)

			result, err := app.ListVPNServices()

			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.errorMessage)
			assert.Nil(t, result)
		})
	}
}

func TestApp_NetworkMethods_ContextUsage(t *testing.T) {
	// Test that all methods properly use the app context
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type contextKey string
	app := createTestApp(ctrl)
	ctx := context.WithValue(context.Background(), contextKey("test"), "value")
	app.OnStartup(ctx)

	t.Run("AddNetwork uses context", func(t *testing.T) {
		app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
			Add(ctx, gomock.Any()).
			Return(&entity.Network{}, nil)

		_, err := app.AddNetwork("Test Network")
		require.NoError(t, err)
	})

	t.Run("ListNetworks uses context", func(t *testing.T) {
		app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
			List(ctx, gomock.Any()).
			Return([]*entity.NetworkWithStatus{}, nil)

		_, err := app.ListNetworks("")
		require.NoError(t, err)
	})

	t.Run("DeleteNetwork uses context", func(t *testing.T) {
		app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
			Delete(ctx, uint64(1)).
			Return(nil)

		err := app.DeleteNetwork(1)
		require.NoError(t, err)
	})

	t.Run("ListVPNServices uses context", func(t *testing.T) {
		app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
			ListVPNServices(ctx).
			Return([]entity.VPNService{}, nil)

		_, err := app.ListVPNServices()
		require.NoError(t, err)
	})
}

func TestApp_NetworkMethods_EdgeCases(t *testing.T) {
	tests := []struct {
		name        string
		networkName string
		description string
	}{
		{
			name:        "network with whitespace",
			networkName: "  Network With Spaces  ",
			description: "Network name with leading and trailing spaces",
		},
		{
			name:        "network with tabs and newlines",
			networkName: "Network\tWith\nSpecial\rChars",
			description: "Network name with special whitespace characters",
		},
		{
			name:        "network with only spaces",
			networkName: "   ",
			description: "Network name with only spaces",
		},
		{
			name:        "network with special characters",
			networkName: "Network!@#$%^&*()+={}[]|\\:;\"'<>?,./",
			description: "Network name with many special characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			expectedNetwork := &entity.Network{
				ID:        123,
				Name:      tt.networkName,
				CreatedAt: entity.NewTimestamp(),
			}

			app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
				Add(gomock.Any(), gomock.Any()).
				DoAndReturn(func(_ context.Context, network *entity.Network) (*entity.Network, error) {
					assert.Equal(t, tt.networkName, network.Name)
					return expectedNetwork, nil
				})

			result, err := app.AddNetwork(tt.networkName)

			require.NoError(t, err)
			assert.Equal(t, expectedNetwork, result)
		})
	}
}

func TestApp_NetworkMethods_ConcurrentAccess(t *testing.T) {
	// Test concurrent access to network methods
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	// Setup expectations for concurrent operations
	app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
		List(gomock.Any(), gomock.Any()).
		Return([]*entity.NetworkWithStatus{}, nil).
		AnyTimes()

	app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
		Add(gomock.Any(), gomock.Any()).
		Return(&entity.Network{ID: 1}, nil).
		AnyTimes()

	app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
		Delete(gomock.Any(), gomock.Any()).
		Return(nil).
		AnyTimes()

	app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
		ListVPNServices(gomock.Any()).
		Return([]entity.VPNService{}, nil).
		AnyTimes()

	// Run multiple operations concurrently
	done := make(chan bool, 4)

	go func() {
		defer func() { done <- true }()
		for range 10 {
			_, err := app.ListNetworks("test")
			assert.NoError(t, err)
		}
	}()

	go func() {
		defer func() { done <- true }()
		for range 10 {
			_, err := app.AddNetwork("test network")
			assert.NoError(t, err)
		}
	}()

	go func() {
		defer func() { done <- true }()
		for i := range 10 {
			err := app.DeleteNetwork(uint64(i + 1))
			assert.NoError(t, err)
		}
	}()

	go func() {
		defer func() { done <- true }()
		for range 10 {
			_, err := app.ListVPNServices()
			assert.NoError(t, err)
		}
	}()

	// Wait for all goroutines to complete
	for range 4 {
		<-done
	}
}

func TestApp_NetworkMethods_NilContext(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	// Don't call OnStartup to leave context as nil

	app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
		Add(gomock.Any(), gomock.Any()).
		Return(&entity.Network{}, nil)

	// Should work even with nil context (methods use a.ctx which starts as nil)
	_, err := app.AddNetwork("test network")
	require.NoError(t, err)
}

func TestApp_ListNetworks_NetworkStatusVariations(t *testing.T) {
	tests := []struct {
		name        string
		networks    []*entity.NetworkWithStatus
		description string
	}{
		{
			name: "all networks active",
			networks: []*entity.NetworkWithStatus{
				{
					Network:  entity.Network{ID: 1, Name: "Network 1"},
					IsActive: true,
				},
				{
					Network:  entity.Network{ID: 2, Name: "Network 2"},
					IsActive: true,
				},
			},
			description: "All networks should be active",
		},
		{
			name: "all networks inactive",
			networks: []*entity.NetworkWithStatus{
				{
					Network:  entity.Network{ID: 1, Name: "Network 1"},
					IsActive: false,
				},
				{
					Network:  entity.Network{ID: 2, Name: "Network 2"},
					IsActive: false,
				},
			},
			description: "All networks should be inactive",
		},
		{
			name: "mixed network status",
			networks: []*entity.NetworkWithStatus{
				{
					Network:  entity.Network{ID: 1, Name: "Active Network"},
					IsActive: true,
				},
				{
					Network:  entity.Network{ID: 2, Name: "Inactive Network"},
					IsActive: false,
				},
			},
			description: "Networks should have mixed status",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.networkUC.(*mock_usecase.MockNetwork).EXPECT().
				List(gomock.Any(), gomock.Any()).
				Return(tt.networks, nil)

			result, err := app.ListNetworks("")

			require.NoError(t, err)
			assert.Equal(t, tt.networks, result)

			// Verify status values
			for i, network := range result {
				assert.Equal(t, tt.networks[i].IsActive, network.IsActive, "Network %d status should match", i)
			}
		})
	}
}
