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

func TestApp_AddHost_Success(t *testing.T) {
	tests := []struct {
		name        string
		address     string
		description string
		expected    *entity.Host
	}{
		{
			name:        "add host with description",
			address:     "192.168.1.100",
			description: "Web server",
			expected: &entity.Host{
				ID:          123,
				Address:     "192.168.1.100",
				Description: stringPtr("Web server"),
				CreatedAt:   entity.NewTimestamp(),
			},
		},
		{
			name:        "add host without description",
			address:     "10.0.0.5",
			description: "",
			expected: &entity.Host{
				ID:          456,
				Address:     "10.0.0.5",
				Description: nil,
				CreatedAt:   entity.NewTimestamp(),
			},
		},
		{
			name:        "add hostname",
			address:     "database.example.com",
			description: "Database server",
			expected: &entity.Host{
				ID:          789,
				Address:     "database.example.com",
				Description: stringPtr("Database server"),
				CreatedAt:   entity.NewTimestamp(),
			},
		},
		{
			name:        "add IPv4 with zero octets",
			address:     "0.0.0.0",
			description: "All interfaces",
			expected: &entity.Host{
				ID:          100,
				Address:     "0.0.0.0",
				Description: stringPtr("All interfaces"),
				CreatedAt:   entity.NewTimestamp(),
			},
		},
		{
			name:        "add IPv4 with max octets",
			address:     "255.255.255.255",
			description: "Broadcast address",
			expected: &entity.Host{
				ID:          200,
				Address:     "255.255.255.255",
				Description: stringPtr("Broadcast address"),
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

			app.hostUC.(*mock_usecase.MockHost).EXPECT().
				Add(gomock.Any(), gomock.Any()).
				DoAndReturn(func(_ context.Context, host *entity.Host) (*entity.Host, error) {
					assert.Equal(t, tt.address, host.Address)
					if tt.description == "" {
						assert.Nil(t, host.Description)
					} else {
						require.NotNil(t, host.Description)
						assert.Equal(t, tt.description, *host.Description)
					}
					return tt.expected, nil
				})

			result, err := app.AddHost(tt.address, tt.description)

			require.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestApp_AddHost_ValidationError(t *testing.T) {
	tests := []struct {
		name        string
		address     string
		description string
		expectedErr string
	}{
		{
			name:        "invalid ip address - too high octets",
			address:     "999.999.999.999",
			description: "Invalid IP",
			expectedErr: "invalid address",
		},
		{
			name:        "invalid ip address - too many octets",
			address:     "192.168.1.1.1",
			description: "Too many octets",
			expectedErr: "invalid address",
		},
		{
			name:        "invalid ip address - negative octets",
			address:     "192.168.1.-1",
			description: "Negative octet",
			expectedErr: "invalid address",
		},
		{
			name:        "invalid ip address - non-numeric",
			address:     "192.168.abc.1",
			description: "Non-numeric octet",
			expectedErr: "invalid address",
		},
		{
			name:        "empty address",
			address:     "",
			description: "Empty address",
			expectedErr: "invalid address",
		},
		{
			name:        "invalid hostname - starts with hyphen",
			address:     "-invalid.com",
			description: "Invalid hostname",
			expectedErr: "invalid address",
		},
		{
			name:        "invalid hostname - ends with hyphen",
			address:     "invalid-.com",
			description: "Invalid hostname",
			expectedErr: "invalid address",
		},
		{
			name:        "invalid hostname - consecutive dots",
			address:     "invalid..com",
			description: "Invalid hostname",
			expectedErr: "invalid address",
		},
		{
			name:        "invalid hostname - starts with dot",
			address:     ".invalid.com",
			description: "Invalid hostname",
			expectedErr: "invalid address",
		},
		{
			name:        "invalid hostname - ends with dot",
			address:     "invalid.com.",
			description: "Invalid hostname",
			expectedErr: "invalid address",
		},
		{
			name:        "address with space",
			address:     "192.168.1.1 ",
			description: "Address with space",
			expectedErr: "invalid address",
		},
		{
			name:        "address with special characters",
			address:     "192.168.1.1@",
			description: "Special characters",
			expectedErr: "invalid address",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			result, err := app.AddHost(tt.address, tt.description)

			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.expectedErr)
			assert.Nil(t, result)
		})
	}
}

func TestApp_AddHost_UseCaseError(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	expectedError := errors.New("database connection failed")
	app.hostUC.(*mock_usecase.MockHost).EXPECT().
		Add(gomock.Any(), gomock.Any()).
		Return(nil, expectedError)

	result, err := app.AddHost("192.168.1.1", "Test host")

	require.Error(t, err)
	assert.Equal(t, expectedError, err)
	assert.Nil(t, result)
}

func TestApp_ListHosts_Success(t *testing.T) {
	tests := []struct {
		name       string
		searchTerm string
		expected   []*entity.Host
	}{
		{
			name:       "list without search",
			searchTerm: "",
			expected: []*entity.Host{
				{
					ID:          1,
					Address:     "192.168.1.1",
					Description: stringPtr("Router"),
					CreatedAt:   entity.NewTimestamp(),
				},
				{
					ID:          2,
					Address:     "192.168.1.2",
					Description: nil,
					CreatedAt:   entity.NewTimestamp(),
				},
				{
					ID:          3,
					Address:     "server.example.com",
					Description: stringPtr("Web server"),
					CreatedAt:   entity.NewTimestamp(),
				},
			},
		},
		{
			name:       "list with search term",
			searchTerm: "server",
			expected: []*entity.Host{
				{
					ID:          3,
					Address:     "server.example.com",
					Description: stringPtr("Web server"),
					CreatedAt:   entity.NewTimestamp(),
				},
			},
		},
		{
			name:       "list with IP search",
			searchTerm: "192.168",
			expected: []*entity.Host{
				{
					ID:          1,
					Address:     "192.168.1.1",
					Description: stringPtr("Router"),
					CreatedAt:   entity.NewTimestamp(),
				},
				{
					ID:          2,
					Address:     "192.168.1.2",
					Description: nil,
					CreatedAt:   entity.NewTimestamp(),
				},
			},
		},
		{
			name:       "empty search results",
			searchTerm: "nonexistent",
			expected:   []*entity.Host{},
		},
		{
			name:       "empty list",
			searchTerm: "",
			expected:   []*entity.Host{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			expectedFilter := &entity.ListHostFilter{Search: tt.searchTerm}

			app.hostUC.(*mock_usecase.MockHost).EXPECT().
				List(gomock.Any(), expectedFilter).
				Return(tt.expected, nil)

			result, err := app.ListHosts(tt.searchTerm)

			require.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestApp_ListHosts_Error(t *testing.T) {
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
			name:         "timeout error",
			searchTerm:   "test",
			expectedErr:  errors.New("query timeout"),
			errorMessage: "query timeout",
		},
		{
			name:         "permission denied",
			searchTerm:   "admin",
			expectedErr:  errors.New("permission denied"),
			errorMessage: "permission denied",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.hostUC.(*mock_usecase.MockHost).EXPECT().
				List(gomock.Any(), gomock.Any()).
				Return(nil, tt.expectedErr)

			result, err := app.ListHosts(tt.searchTerm)

			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.errorMessage)
			assert.Nil(t, result)
		})
	}
}

func TestApp_DeleteHost_Success(t *testing.T) {
	tests := []struct {
		name   string
		hostID uint64
	}{
		{
			name:   "delete existing host",
			hostID: 123,
		},
		{
			name:   "delete host with ID 1",
			hostID: 1,
		},
		{
			name:   "delete host with large ID",
			hostID: 999999,
		},
		{
			name:   "delete host with ID 0",
			hostID: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.hostUC.(*mock_usecase.MockHost).EXPECT().
				Delete(gomock.Any(), tt.hostID).
				Return(nil)

			err := app.DeleteHost(tt.hostID)

			require.NoError(t, err)
		})
	}
}

func TestApp_DeleteHost_Error(t *testing.T) {
	tests := []struct {
		name         string
		hostID       uint64
		expectedErr  error
		errorMessage string
	}{
		{
			name:         "host not found",
			hostID:       123,
			expectedErr:  errors.New("host not found"),
			errorMessage: "host not found",
		},
		{
			name:         "database error",
			hostID:       456,
			expectedErr:  errors.New("database connection failed"),
			errorMessage: "database connection failed",
		},
		{
			name:         "foreign key constraint",
			hostID:       789,
			expectedErr:  errors.New("host is referenced by other records"),
			errorMessage: "host is referenced by other records",
		},
		{
			name:         "permission denied",
			hostID:       100,
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

			app.hostUC.(*mock_usecase.MockHost).EXPECT().
				Delete(gomock.Any(), tt.hostID).
				Return(tt.expectedErr)

			err := app.DeleteHost(tt.hostID)

			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.errorMessage)
		})
	}
}

func TestApp_HostMethods_ContextUsage(t *testing.T) {
	// Test that all methods properly use the app context
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type contextKey string
	app := createTestApp(ctrl)
	ctx := context.WithValue(context.Background(), contextKey("test"), "value")
	app.OnStartup(ctx)

	t.Run("AddHost uses context", func(t *testing.T) {
		app.hostUC.(*mock_usecase.MockHost).EXPECT().
			Add(ctx, gomock.Any()).
			Return(&entity.Host{}, nil)

		_, err := app.AddHost("192.168.1.1", "test")
		require.NoError(t, err)
	})

	t.Run("ListHosts uses context", func(t *testing.T) {
		app.hostUC.(*mock_usecase.MockHost).EXPECT().
			List(ctx, gomock.Any()).
			Return([]*entity.Host{}, nil)

		_, err := app.ListHosts("")
		require.NoError(t, err)
	})

	t.Run("DeleteHost uses context", func(t *testing.T) {
		app.hostUC.(*mock_usecase.MockHost).EXPECT().
			Delete(ctx, uint64(1)).
			Return(nil)

		err := app.DeleteHost(1)
		require.NoError(t, err)
	})
}

func TestApp_AddHost_EdgeCases(t *testing.T) {
	tests := []struct {
		name        string
		address     string
		description string
		shouldPass  bool
	}{
		{
			name:        "localhost",
			address:     "localhost",
			description: "Local machine",
			shouldPass:  false, // localhost is invalid because it lacks TLD
		},
		{
			name:        "subdomain with multiple levels",
			address:     "api.v1.service.example.com",
			description: "API service",
			shouldPass:  true,
		},
		{
			name:        "hostname with numbers",
			address:     "server123.example.com",
			description: "Server 123",
			shouldPass:  true,
		},
		{
			name:        "hyphenated hostname",
			address:     "web-server.example.com",
			description: "Web server",
			shouldPass:  true,
		},
		{
			name:        "very long description",
			address:     "192.168.1.1",
			description: "This is a very long description that contains a lot of text to test how the system handles lengthy descriptions that might exceed typical database field limits or cause other issues",
			shouldPass:  true,
		},
		{
			name:        "unicode in description",
			address:     "192.168.1.1",
			description: "服务器 🖥️ Server",
			shouldPass:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			if tt.shouldPass {
				expectedHost := &entity.Host{
					ID:        123,
					Address:   tt.address,
					CreatedAt: entity.NewTimestamp(),
				}
				if tt.description != "" {
					expectedHost.Description = &tt.description
				}

				app.hostUC.(*mock_usecase.MockHost).EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(expectedHost, nil)

				result, err := app.AddHost(tt.address, tt.description)

				require.NoError(t, err)
				assert.Equal(t, expectedHost, result)
			} else {
				result, err := app.AddHost(tt.address, tt.description)

				require.Error(t, err)
				assert.Nil(t, result)
			}
		})
	}
}

func TestApp_HostMethods_ConcurrentAccess(t *testing.T) {
	// Test concurrent access to host methods
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	// Setup expectations for concurrent operations
	app.hostUC.(*mock_usecase.MockHost).EXPECT().
		List(gomock.Any(), gomock.Any()).
		Return([]*entity.Host{}, nil).
		AnyTimes()

	app.hostUC.(*mock_usecase.MockHost).EXPECT().
		Add(gomock.Any(), gomock.Any()).
		Return(&entity.Host{ID: 1}, nil).
		AnyTimes()

	app.hostUC.(*mock_usecase.MockHost).EXPECT().
		Delete(gomock.Any(), gomock.Any()).
		Return(nil).
		AnyTimes()

	// Run multiple operations concurrently
	done := make(chan bool, 3)

	go func() {
		defer func() { done <- true }()
		for range 10 {
			_, err := app.ListHosts("test")
			assert.NoError(t, err)
		}
	}()

	go func() {
		defer func() { done <- true }()
		for range 10 {
			_, err := app.AddHost("192.168.1.1", "test")
			assert.NoError(t, err)
		}
	}()

	go func() {
		defer func() { done <- true }()
		for i := range 10 {
			err := app.DeleteHost(uint64(i + 1))
			assert.NoError(t, err)
		}
	}()

	// Wait for all goroutines to complete
	for range 3 {
		<-done
	}
}

func TestApp_Host_NilContext(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	// Don't call OnStartup to leave context as nil

	app.hostUC.(*mock_usecase.MockHost).EXPECT().
		Add(gomock.Any(), gomock.Any()).
		Return(&entity.Host{}, nil)

	// Should work even with nil context (methods use a.ctx which starts as nil)
	_, err := app.AddHost("192.168.1.1", "test")
	require.NoError(t, err)
}
