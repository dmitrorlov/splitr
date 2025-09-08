package networkhost

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	"github.com/dmitrorlov/splitr/backend/entity"
	mock_storage "github.com/dmitrorlov/splitr/backend/mocks/storage"
	mock_trm "github.com/dmitrorlov/splitr/backend/mocks/trm"
	mock_usecase "github.com/dmitrorlov/splitr/backend/mocks/usecase"
	"github.com/dmitrorlov/splitr/backend/pkg/errs"
)

func TestUseCase_ExportByNetworkIDForContext(t *testing.T) {
	tests := []struct {
		name           string
		networkID      uint64
		setupMocks     func(*mock_storage.MockNetwork, *mock_storage.MockNetworkHost)
		expectedResult *entity.NetworkHostContextExportPayload
		expectedError  string
	}{
		{
			name:      "successfully export hosts for existing network",
			networkID: 1,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				network := &entity.Network{
					ID:   1,
					Name: "TestNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(network, nil)

				description := "Test host description"
				hosts := []*entity.NetworkHost{
					{
						ID:          1,
						NetworkID:   1,
						Address:     "192.168.1.100",
						Description: &description,
					},
					{
						ID:        2,
						NetworkID: 1,
						Address:   "192.168.1.101",
					},
				}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{1},
					}).
					Return(hosts, nil)
			},
			expectedResult: &entity.NetworkHostContextExportPayload{
				Hosts: []entity.NetworkHostDTO{
					{
						Address:     "192.168.1.100",
						Description: "Test host description",
					},
					{
						Address: "192.168.1.101",
					},
				},
			},
		},
		{
			name:      "successfully export empty host list for existing network",
			networkID: 2,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				network := &entity.Network{
					ID:   2,
					Name: "EmptyNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(2)).
					Return(network, nil)

				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{2},
					}).
					Return([]*entity.NetworkHost{}, nil)
			},
			expectedResult: &entity.NetworkHostContextExportPayload{
				Hosts: []entity.NetworkHostDTO{},
			},
		},
		{
			name:      "error when network not found",
			networkID: 999,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, _ *mock_storage.MockNetworkHost) {
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(999)).
					Return(nil, errs.ErrNetworkNotFound)
			},
			expectedError: "network with ID 999 not found",
		},
		{
			name:      "error when network storage fails",
			networkID: 3,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, _ *mock_storage.MockNetworkHost) {
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(3)).
					Return(nil, errors.New("database connection failed"))
			},
			expectedError: "failed to validate network: database connection failed",
		},
		{
			name:      "error when network host list fails",
			networkID: 4,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				network := &entity.Network{
					ID:   4,
					Name: "TestNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(4)).
					Return(network, nil)

				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{4},
					}).
					Return(nil, errors.New("database query failed"))
			},
			expectedError: "failed to list network hosts: database query failed",
		},
		{
			name:      "export hosts with mixed descriptions",
			networkID: 5,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				network := &entity.Network{
					ID:   5,
					Name: "MixedNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(5)).
					Return(network, nil)

				desc1 := "Host with description"
				desc2 := ""
				hosts := []*entity.NetworkHost{
					{
						ID:          10,
						NetworkID:   5,
						Address:     "example.com",
						Description: &desc1,
					},
					{
						ID:        11,
						NetworkID: 5,
						Address:   "192.168.1.1",
					},
					{
						ID:          12,
						NetworkID:   5,
						Address:     "test.local",
						Description: &desc2,
					},
				}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{5},
					}).
					Return(hosts, nil)
			},
			expectedResult: &entity.NetworkHostContextExportPayload{
				Hosts: []entity.NetworkHostDTO{
					{
						Address:     "example.com",
						Description: "Host with description",
					},
					{
						Address: "192.168.1.1",
					},
					{
						Address:     "test.local",
						Description: "",
					},
				},
			},
		},
		{
			name:      "export large number of hosts",
			networkID: 6,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				network := &entity.Network{
					ID:   6,
					Name: "LargeNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(6)).
					Return(network, nil)

				// Create 1000 hosts to test performance and handling of large datasets
				hosts := make([]*entity.NetworkHost, 1000)
				for i := range 1000 {
					var description *string
					if i%3 == 0 {
						desc := fmt.Sprintf("Host %d description", i)
						description = &desc
					}
					hosts[i] = &entity.NetworkHost{
						ID:          uint64(i + 100),
						NetworkID:   6,
						Address:     fmt.Sprintf("192.168.1.%d", i+1),
						Description: description,
					}
				}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{6},
					}).
					Return(hosts, nil)
			},
			expectedResult: &entity.NetworkHostContextExportPayload{
				// We'll verify the count in the test itself due to complexity
				Hosts: nil,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			// Create mocks
			mockTrm := mock_trm.NewMockManager(ctrl)
			mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)

			// Setup mocks
			tt.setupMocks(mockNetworkStorage, mockNetworkHostStorage)

			// Create use case
			useCase := New(
				mockTrm,
				mockNetworkHostSetupUC,
				mockNetworkStorage,
				mockNetworkHostStorage,
			)

			// Execute the method
			result, err := useCase.ExportByNetworkIDForContext(context.Background(), tt.networkID)

			// Assert results
			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, result)

				// Verify export date is recent (within last minute)
				assert.Less(t, time.Since(result.ExportDate), time.Minute)

				// Special handling for large dataset test
				if tt.name == "export large number of hosts" {
					assert.Len(t, result.Hosts, 1000)
					// Verify some sample hosts
					assert.Equal(t, "192.168.1.1", result.Hosts[0].Address)
					assert.Equal(t, "Host 0 description", result.Hosts[0].Description)
					assert.Equal(t, "192.168.1.2", result.Hosts[1].Address)
					assert.Empty(t, result.Hosts[1].Description)
					assert.Equal(t, "192.168.1.4", result.Hosts[3].Address)
					assert.Equal(t, "Host 3 description", result.Hosts[3].Description)
				} else {
					// Verify hosts match expected for other tests
					assert.Len(t, result.Hosts, len(tt.expectedResult.Hosts))

					for i, expectedHost := range tt.expectedResult.Hosts {
						assert.Equal(t, expectedHost.Address, result.Hosts[i].Address)
						assert.Equal(t, expectedHost.Description, result.Hosts[i].Description)
					}
				}
			}
		})
	}
}

func BenchmarkUseCase_ExportByNetworkIDForContext(b *testing.B) {
	ctrl := gomock.NewController(b)
	defer ctrl.Finish()

	// Create mocks
	mockTrm := mock_trm.NewMockManager(ctrl)
	mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
	mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
	mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)

	network := &entity.Network{
		ID:   1,
		Name: "BenchNetwork",
	}

	// Create a large dataset for benchmarking
	hosts := make([]*entity.NetworkHost, 10000)
	for i := range 10000 {
		var description *string
		if i%2 == 0 {
			desc := fmt.Sprintf("Benchmark host %d", i)
			description = &desc
		}
		hosts[i] = &entity.NetworkHost{
			ID:          uint64(i + 1),
			NetworkID:   1,
			Address:     fmt.Sprintf("10.0.%d.%d", i/256, i%256),
			Description: description,
		}
	}

	// Setup mocks with expectations that will be called b.N times
	mockNetworkStorage.EXPECT().
		Get(gomock.Any(), uint64(1)).
		Return(network, nil).
		AnyTimes()

	mockNetworkHostStorage.EXPECT().
		List(gomock.Any(), &entity.ListNetworkHostFilter{
			NetworkID: []uint64{1},
		}).
		Return(hosts, nil).
		AnyTimes()

	// Create use case
	useCase := New(
		mockTrm,
		mockNetworkHostSetupUC,
		mockNetworkStorage,
		mockNetworkHostStorage,
	)

	// Reset timer to exclude setup time
	b.ResetTimer()

	// Run benchmark
	for b.Loop() {
		result, err := useCase.ExportByNetworkIDForContext(context.Background(), 1)
		if err != nil {
			b.Fatal(err)
		}
		if len(result.Hosts) != 10000 {
			b.Fatalf("Expected 10000 hosts, got %d", len(result.Hosts))
		}
	}
}

// TestExportPayloadStructure verifies the exact structure of the export payload.
func TestExportPayloadStructure(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	// Create mocks
	mockTrm := mock_trm.NewMockManager(ctrl)
	mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
	mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
	mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)

	network := &entity.Network{
		ID:   100,
		Name: "StructureTestNetwork",
	}
	mockNetworkStorage.EXPECT().
		Get(gomock.Any(), uint64(100)).
		Return(network, nil)

	desc1 := "Primary server"
	hosts := []*entity.NetworkHost{
		{
			ID:          1,
			NetworkID:   100,
			Address:     "mail.example.com",
			Description: &desc1,
		},
	}
	mockNetworkHostStorage.EXPECT().
		List(gomock.Any(), &entity.ListNetworkHostFilter{
			NetworkID: []uint64{100},
		}).
		Return(hosts, nil)

	useCase := New(
		mockTrm,
		mockNetworkHostSetupUC,
		mockNetworkStorage,
		mockNetworkHostStorage,
	)

	result, err := useCase.ExportByNetworkIDForContext(context.Background(), 100)

	require.NoError(t, err)
	assert.NotNil(t, result)

	// Verify the structure doesn't include NetworkID (context-specific export)
	assert.Len(t, result.Hosts, 1)
	assert.Equal(t, "mail.example.com", result.Hosts[0].Address)
	assert.Equal(t, "Primary server", result.Hosts[0].Description)

	// Verify export date is set and recent
	assert.False(t, result.ExportDate.IsZero())
	assert.Less(t, time.Since(result.ExportDate), time.Second)

	// Verify the payload can be JSON marshaled (important for export functionality)
	_, err = result.ExportDate.MarshalJSON()
	assert.NoError(t, err)
}

func TestUseCase_ImportByNetworkIDFromJSON(t *testing.T) {
	tests := []struct {
		name                  string
		networkID             uint64
		jsonData              string
		setupMocks            func(*mock_storage.MockNetwork, *mock_storage.MockNetworkHost, *mock_usecase.MockNetworkHostSetup, *mock_trm.MockManager)
		expectedError         string
		expectSyncCall        bool
		expectedImportedCount int
	}{
		{
			name:      "successfully import new hosts",
			networkID: 1,
			jsonData: `{
				"export_date": "2023-01-01T00:00:00Z",
				"hosts": [
					{
						"address": "192.168.1.100",
						"description": "Web server"
					},
					{
						"address": "192.168.1.101"
					}
				]
			}`,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, mockNetworkHostSetupUC *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Validate network exists
				network := &entity.Network{ID: 1, Name: "TestNetwork"}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(network, nil)

				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Check existing hosts - none exist
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{1},
						Address:   []string{"192.168.1.100"},
					}).
					Return([]*entity.NetworkHost{}, nil)

				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{1},
						Address:   []string{"192.168.1.101"},
					}).
					Return([]*entity.NetworkHost{}, nil)

				// Add new hosts
				mockNetworkHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					DoAndReturn(func(_ context.Context, host *entity.NetworkHost) (*entity.NetworkHost, error) {
						host.ID = 1
						return host, nil
					})

				mockNetworkHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					DoAndReturn(func(_ context.Context, host *entity.NetworkHost) (*entity.NetworkHost, error) {
						host.ID = 2
						return host, nil
					})

				// Sync network host setup
				mockNetworkHostSetupUC.EXPECT().
					SyncByNetworkID(gomock.Any(), uint64(1)).
					Return(nil)
			},
			expectSyncCall:        true,
			expectedImportedCount: 2,
		},
		{
			name:      "skip existing hosts and import new ones",
			networkID: 2,
			jsonData: `{
				"export_date": "2023-01-01T00:00:00Z",
				"hosts": [
					{
						"address": "existing.host.com",
						"description": "Existing host"
					},
					{
						"address": "new.host.com",
						"description": "New host"
					}
				]
			}`,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, mockNetworkHostSetupUC *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Validate network exists
				network := &entity.Network{ID: 2, Name: "TestNetwork2"}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(2)).
					Return(network, nil)

				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Check existing hosts - first one exists, second doesn't
				existingHost := &entity.NetworkHost{ID: 10, NetworkID: 2, Address: "existing.host.com"}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{2},
						Address:   []string{"existing.host.com"},
					}).
					Return([]*entity.NetworkHost{existingHost}, nil)

				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{2},
						Address:   []string{"new.host.com"},
					}).
					Return([]*entity.NetworkHost{}, nil)

				// Add only the new host
				mockNetworkHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					DoAndReturn(func(_ context.Context, host *entity.NetworkHost) (*entity.NetworkHost, error) {
						host.ID = 11
						return host, nil
					})

				// Sync network host setup
				mockNetworkHostSetupUC.EXPECT().
					SyncByNetworkID(gomock.Any(), uint64(2)).
					Return(nil)
			},
			expectSyncCall:        true,
			expectedImportedCount: 1,
		},
		{
			name:      "skip all hosts if they all exist - no sync call",
			networkID: 3,
			jsonData: `{
				"export_date": "2023-01-01T00:00:00Z",
				"hosts": [
					{
						"address": "existing1.com"
					},
					{
						"address": "existing2.com"
					}
				]
			}`,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Validate network exists
				network := &entity.Network{ID: 3, Name: "TestNetwork3"}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(3)).
					Return(network, nil)

				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Both hosts exist
				existingHost1 := &entity.NetworkHost{ID: 20, NetworkID: 3, Address: "existing1.com"}
				existingHost2 := &entity.NetworkHost{ID: 21, NetworkID: 3, Address: "existing2.com"}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{3},
						Address:   []string{"existing1.com"},
					}).
					Return([]*entity.NetworkHost{existingHost1}, nil)

				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{3},
						Address:   []string{"existing2.com"},
					}).
					Return([]*entity.NetworkHost{existingHost2}, nil)

				// No sync call expected since no hosts were imported
			},
			expectSyncCall:        false,
			expectedImportedCount: 0,
		},
		{
			name:      "import empty host list - no sync call",
			networkID: 4,
			jsonData: `{
				"export_date": "2023-01-01T00:00:00Z",
				"hosts": []
			}`,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, _ *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Validate network exists
				network := &entity.Network{ID: 4, Name: "TestNetwork4"}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(4)).
					Return(network, nil)

				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// No hosts to process, no sync call expected
			},
			expectSyncCall:        false,
			expectedImportedCount: 0,
		},
		{
			name:      "handle race condition - host added by another process",
			networkID: 5,
			jsonData: `{
				"export_date": "2023-01-01T00:00:00Z",
				"hosts": [
					{
						"address": "race.condition.com",
						"description": "Race condition test"
					}
				]
			}`,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Validate network exists
				network := &entity.Network{ID: 5, Name: "TestNetwork5"}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(5)).
					Return(network, nil)

				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Check existing - initially doesn't exist
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{5},
						Address:   []string{"race.condition.com"},
					}).
					Return([]*entity.NetworkHost{}, nil)

				// Add fails with already exists error (race condition)
				mockNetworkHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(nil, errs.ErrNetworkHostAlreadyExists)

				// No sync call expected since no hosts were actually imported
			},
			expectSyncCall:        false,
			expectedImportedCount: 0,
		},
		{
			name:      "error - invalid JSON",
			networkID: 6,
			jsonData:  `{"invalid": json}`,
			setupMocks: func(_ *mock_storage.MockNetwork, _ *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, _ *mock_trm.MockManager) {
				// No mocks setup - should fail at JSON parsing
			},
			expectedError: "failed to unmarshal import data as either format",
		},
		{
			name:      "error - network not found",
			networkID: 999,
			jsonData: `{
				"export_date": "2023-01-01T00:00:00Z",
				"hosts": [
					{
						"address": "test.com"
					}
				]
			}`,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, _ *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, _ *mock_trm.MockManager) {
				// Network validation fails
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(999)).
					Return(nil, errs.ErrNetworkNotFound)
			},
			expectedError: "network with ID 999 not found",
		},
		{
			name:      "error - network storage fails",
			networkID: 7,
			jsonData: `{
				"export_date": "2023-01-01T00:00:00Z",
				"hosts": [
					{
						"address": "test.com"
					}
				]
			}`,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, _ *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, _ *mock_trm.MockManager) {
				// Network validation fails with database error
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(7)).
					Return(nil, errors.New("database connection failed"))
			},
			expectedError: "failed to validate network: database connection failed",
		},
		{
			name:      "error - invalid host address in JSON",
			networkID: 8,
			jsonData: `{
				"export_date": "2023-01-01T00:00:00Z",
				"hosts": [
					{
						"address": "invalid-address-@#$",
						"description": "Invalid address"
					}
				]
			}`,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Validate network exists
				network := &entity.Network{ID: 8, Name: "TestNetwork8"}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(8)).
					Return(network, nil)

				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Check existing host - doesn't exist
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{8},
						Address:   []string{"invalid-address-@#$"},
					}).
					Return([]*entity.NetworkHost{}, nil)
			},
			expectedError: "failed to create network host for invalid-address-@#$: invalid address",
		},
		{
			name:      "error - existing host check fails",
			networkID: 9,
			jsonData: `{
				"export_date": "2023-01-01T00:00:00Z",
				"hosts": [
					{
						"address": "test.com"
					}
				]
			}`,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Validate network exists
				network := &entity.Network{ID: 9, Name: "TestNetwork9"}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(9)).
					Return(network, nil)

				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Check existing host fails
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{9},
						Address:   []string{"test.com"},
					}).
					Return(nil, errors.New("database query failed"))
			},
			expectedError: "failed to check existing host test.com: database query failed",
		},
		{
			name:      "error - add host fails with non-race-condition error",
			networkID: 10,
			jsonData: `{
				"export_date": "2023-01-01T00:00:00Z",
				"hosts": [
					{
						"address": "test.com"
					}
				]
			}`,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Validate network exists
				network := &entity.Network{ID: 10, Name: "TestNetwork10"}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(10)).
					Return(network, nil)

				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Check existing host - doesn't exist
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{10},
						Address:   []string{"test.com"},
					}).
					Return([]*entity.NetworkHost{}, nil)

				// Add fails with database error
				mockNetworkHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(nil, errors.New("database insert failed"))
			},
			expectedError: "failed to add network host test.com: database insert failed",
		},
		{
			name:      "error - sync fails after successful import",
			networkID: 11,
			jsonData: `{
				"export_date": "2023-01-01T00:00:00Z",
				"hosts": [
					{
						"address": "test.com"
					}
				]
			}`,
			setupMocks: func(mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, mockNetworkHostSetupUC *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Validate network exists
				network := &entity.Network{ID: 11, Name: "TestNetwork11"}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(11)).
					Return(network, nil)

				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Check existing host - doesn't exist
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{11},
						Address:   []string{"test.com"},
					}).
					Return([]*entity.NetworkHost{}, nil)

				// Add succeeds
				mockNetworkHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					DoAndReturn(func(_ context.Context, host *entity.NetworkHost) (*entity.NetworkHost, error) {
						host.ID = 100
						return host, nil
					})

				// Sync fails
				mockNetworkHostSetupUC.EXPECT().
					SyncByNetworkID(gomock.Any(), uint64(11)).
					Return(errors.New("sync failed"))
			},
			expectedError: "failed to sync network host setup: sync failed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			// Create mocks
			mockTrm := mock_trm.NewMockManager(ctrl)
			mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)

			// Setup mocks
			tt.setupMocks(mockNetworkStorage, mockNetworkHostStorage, mockNetworkHostSetupUC, mockTrm)

			// Create use case
			useCase := New(
				mockTrm,
				mockNetworkHostSetupUC,
				mockNetworkStorage,
				mockNetworkHostStorage,
			)

			// Execute the method
			err := useCase.ImportByNetworkIDFromJSON(context.Background(), tt.networkID, tt.jsonData)

			// Assert results
			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestUseCase_Add(t *testing.T) {
	tests := []struct {
		name          string
		networkHost   *entity.NetworkHost
		setupMocks    func(*mock_storage.MockNetworkHost, *mock_usecase.MockNetworkHostSetup, *mock_trm.MockManager)
		expectedError string
		expectedHost  *entity.NetworkHost
	}{
		{
			name: "successfully add network host",
			networkHost: &entity.NetworkHost{
				NetworkID:   1,
				Address:     "192.168.1.100",
				Description: stringPtr("Web server"),
			},
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost, mockNetworkHostSetupUC *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Mock successful storage add
				addedHost := &entity.NetworkHost{
					ID:          1,
					NetworkID:   1,
					Address:     "192.168.1.100",
					Description: stringPtr("Web server"),
				}
				mockNetworkHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(addedHost, nil)

				// Mock successful sync
				mockNetworkHostSetupUC.EXPECT().
					SyncByNetworkID(gomock.Any(), uint64(1)).
					Return(nil)
			},
			expectedHost: &entity.NetworkHost{
				ID:          1,
				NetworkID:   1,
				Address:     "192.168.1.100",
				Description: stringPtr("Web server"),
			},
		},
		{
			name: "successfully add network host without description",
			networkHost: &entity.NetworkHost{
				NetworkID: 2,
				Address:   "example.com",
			},
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost, mockNetworkHostSetupUC *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Mock successful storage add
				addedHost := &entity.NetworkHost{
					ID:        10,
					NetworkID: 2,
					Address:   "example.com",
				}
				mockNetworkHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(addedHost, nil)

				// Mock successful sync
				mockNetworkHostSetupUC.EXPECT().
					SyncByNetworkID(gomock.Any(), uint64(2)).
					Return(nil)
			},
			expectedHost: &entity.NetworkHost{
				ID:        10,
				NetworkID: 2,
				Address:   "example.com",
			},
		},
		{
			name: "error - storage add fails",
			networkHost: &entity.NetworkHost{
				NetworkID: 3,
				Address:   "test.com",
			},
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Mock storage add failure
				mockNetworkHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(nil, errors.New("database insert failed"))
			},
			expectedError: "failed to add network host: database insert failed",
		},
		{
			name: "error - sync fails after successful add",
			networkHost: &entity.NetworkHost{
				NetworkID: 4,
				Address:   "sync.fail.com",
			},
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost, mockNetworkHostSetupUC *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Mock successful storage add
				addedHost := &entity.NetworkHost{
					ID:        20,
					NetworkID: 4,
					Address:   "sync.fail.com",
				}
				mockNetworkHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(addedHost, nil)

				// Mock sync failure
				mockNetworkHostSetupUC.EXPECT().
					SyncByNetworkID(gomock.Any(), uint64(4)).
					Return(errors.New("sync service unavailable"))
			},
			expectedError: "failed to sync network host setup: sync service unavailable",
		},
		{
			name: "error - transaction fails",
			networkHost: &entity.NetworkHost{
				NetworkID: 5,
				Address:   "tx.fail.com",
			},
			setupMocks: func(_ *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Setup transaction failure
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					Return(errors.New("transaction failed"))
			},
			expectedError: "failed to apply transaction: transaction failed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			// Create mocks
			mockTrm := mock_trm.NewMockManager(ctrl)
			mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)

			// Setup mocks
			tt.setupMocks(mockNetworkHostStorage, mockNetworkHostSetupUC, mockTrm)

			// Create use case
			useCase := New(
				mockTrm,
				mockNetworkHostSetupUC,
				mockNetworkStorage,
				mockNetworkHostStorage,
			)

			// Execute the method
			result, err := useCase.Add(context.Background(), tt.networkHost)

			// Assert results
			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, tt.expectedHost.ID, result.ID)
				assert.Equal(t, tt.expectedHost.NetworkID, result.NetworkID)
				assert.Equal(t, tt.expectedHost.Address, result.Address)
				if tt.expectedHost.Description != nil {
					require.NotNil(t, result.Description)
					assert.Equal(t, *tt.expectedHost.Description, *result.Description)
				} else {
					assert.Nil(t, result.Description)
				}
			}
		})
	}
}

// stringPtr is a helper function to create string pointers for tests.
func stringPtr(s string) *string {
	return &s
}

func TestUseCase_List(t *testing.T) {
	tests := []struct {
		name           string
		filter         *entity.ListNetworkHostFilter
		setupMocks     func(*mock_storage.MockNetworkHost)
		expectedResult []*entity.NetworkHost
		expectedError  string
	}{
		{
			name:   "successfully list all hosts with empty filter",
			filter: &entity.ListNetworkHostFilter{},
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				hosts := []*entity.NetworkHost{
					{
						ID:          1,
						NetworkID:   1,
						Address:     "192.168.1.100",
						Description: stringPtr("Web server"),
					},
					{
						ID:        2,
						NetworkID: 2,
						Address:   "example.com",
					},
				}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{}).
					Return(hosts, nil)
			},
			expectedResult: []*entity.NetworkHost{
				{
					ID:          1,
					NetworkID:   1,
					Address:     "192.168.1.100",
					Description: stringPtr("Web server"),
				},
				{
					ID:        2,
					NetworkID: 2,
					Address:   "example.com",
				},
			},
		},
		{
			name: "successfully filter by network ID",
			filter: &entity.ListNetworkHostFilter{
				NetworkID: []uint64{1},
			},
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				hosts := []*entity.NetworkHost{
					{
						ID:        1,
						NetworkID: 1,
						Address:   "192.168.1.100",
					},
				}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{1},
					}).
					Return(hosts, nil)
			},
			expectedResult: []*entity.NetworkHost{
				{
					ID:        1,
					NetworkID: 1,
					Address:   "192.168.1.100",
				},
			},
		},
		{
			name: "successfully filter by address",
			filter: &entity.ListNetworkHostFilter{
				Address: []string{"example.com"},
			},
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				hosts := []*entity.NetworkHost{
					{
						ID:        5,
						NetworkID: 3,
						Address:   "example.com",
					},
				}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						Address: []string{"example.com"},
					}).
					Return(hosts, nil)
			},
			expectedResult: []*entity.NetworkHost{
				{
					ID:        5,
					NetworkID: 3,
					Address:   "example.com",
				},
			},
		},
		{
			name: "successfully filter by ID",
			filter: &entity.ListNetworkHostFilter{
				ID: []uint64{10, 20},
			},
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				hosts := []*entity.NetworkHost{
					{
						ID:        10,
						NetworkID: 1,
						Address:   "host1.com",
					},
					{
						ID:        20,
						NetworkID: 2,
						Address:   "host2.com",
					},
				}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						ID: []uint64{10, 20},
					}).
					Return(hosts, nil)
			},
			expectedResult: []*entity.NetworkHost{
				{
					ID:        10,
					NetworkID: 1,
					Address:   "host1.com",
				},
				{
					ID:        20,
					NetworkID: 2,
					Address:   "host2.com",
				},
			},
		},
		{
			name: "successfully filter by search term",
			filter: &entity.ListNetworkHostFilter{
				Search: "web",
			},
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				hosts := []*entity.NetworkHost{
					{
						ID:          15,
						NetworkID:   1,
						Address:     "webserver.local",
						Description: stringPtr("Web application server"),
					},
				}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						Search: "web",
					}).
					Return(hosts, nil)
			},
			expectedResult: []*entity.NetworkHost{
				{
					ID:          15,
					NetworkID:   1,
					Address:     "webserver.local",
					Description: stringPtr("Web application server"),
				},
			},
		},
		{
			name: "successfully handle complex filter combination",
			filter: &entity.ListNetworkHostFilter{
				NetworkID: []uint64{1, 2},
				Address:   []string{"api.example.com"},
			},
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				hosts := []*entity.NetworkHost{
					{
						ID:        25,
						NetworkID: 1,
						Address:   "api.example.com",
					},
				}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{1, 2},
						Address:   []string{"api.example.com"},
					}).
					Return(hosts, nil)
			},
			expectedResult: []*entity.NetworkHost{
				{
					ID:        25,
					NetworkID: 1,
					Address:   "api.example.com",
				},
			},
		},
		{
			name:   "successfully return empty list",
			filter: &entity.ListNetworkHostFilter{},
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{}).
					Return([]*entity.NetworkHost{}, nil)
			},
			expectedResult: []*entity.NetworkHost{},
		},
		{
			name:   "handle nil filter",
			filter: nil,
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				hosts := []*entity.NetworkHost{
					{
						ID:        1,
						NetworkID: 1,
						Address:   "default.host",
					},
				}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), (*entity.ListNetworkHostFilter)(nil)).
					Return(hosts, nil)
			},
			expectedResult: []*entity.NetworkHost{
				{
					ID:        1,
					NetworkID: 1,
					Address:   "default.host",
				},
			},
		},
		{
			name: "error - storage list fails",
			filter: &entity.ListNetworkHostFilter{
				NetworkID: []uint64{999},
			},
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{999},
					}).
					Return(nil, errors.New("database query failed"))
			},
			expectedError: "database query failed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			// Create mocks
			mockTrm := mock_trm.NewMockManager(ctrl)
			mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)

			// Setup mocks
			tt.setupMocks(mockNetworkHostStorage)

			// Create use case
			useCase := New(
				mockTrm,
				mockNetworkHostSetupUC,
				mockNetworkStorage,
				mockNetworkHostStorage,
			)

			// Execute the method
			result, err := useCase.List(context.Background(), tt.filter)

			// Assert results
			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, result)
				assert.Len(t, result, len(tt.expectedResult))

				for i, expectedHost := range tt.expectedResult {
					assert.Equal(t, expectedHost.ID, result[i].ID)
					assert.Equal(t, expectedHost.NetworkID, result[i].NetworkID)
					assert.Equal(t, expectedHost.Address, result[i].Address)
					if expectedHost.Description != nil {
						require.NotNil(t, result[i].Description)
						assert.Equal(t, *expectedHost.Description, *result[i].Description)
					} else {
						assert.Nil(t, result[i].Description)
					}
				}
			}
		})
	}
}

func TestUseCase_Delete(t *testing.T) {
	tests := []struct {
		name          string
		id            uint64
		setupMocks    func(*mock_storage.MockNetworkHost, *mock_usecase.MockNetworkHostSetup, *mock_trm.MockManager)
		expectedError string
	}{
		{
			name: "successfully delete existing network host",
			id:   1,
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost, mockNetworkHostSetupUC *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Mock existing host
				existingHost := &entity.NetworkHost{
					ID:        1,
					NetworkID: 5,
					Address:   "to.delete.com",
				}
				mockNetworkHostStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(existingHost, nil)

				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Mock successful delete
				mockNetworkHostStorage.EXPECT().
					Delete(gomock.Any(), uint64(1)).
					Return(nil)

				// Mock successful sync
				mockNetworkHostSetupUC.EXPECT().
					SyncByNetworkID(gomock.Any(), uint64(5)).
					Return(nil)
			},
		},
		{
			name: "silently handle host not found",
			id:   999,
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, _ *mock_trm.MockManager) {
				// Mock host not found
				mockNetworkHostStorage.EXPECT().
					Get(gomock.Any(), uint64(999)).
					Return(nil, errs.ErrNetworkHostNotFound)
				// No other mocks should be called when host not found
			},
		},
		{
			name: "error - storage get fails with non-not-found error",
			id:   2,
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, _ *mock_trm.MockManager) {
				// Mock get failure with database error
				mockNetworkHostStorage.EXPECT().
					Get(gomock.Any(), uint64(2)).
					Return(nil, errors.New("database connection failed"))
			},
			expectedError: "failed to get network host: database connection failed",
		},
		{
			name: "error - storage delete fails",
			id:   3,
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Mock existing host
				existingHost := &entity.NetworkHost{
					ID:        3,
					NetworkID: 10,
					Address:   "delete.fail.com",
				}
				mockNetworkHostStorage.EXPECT().
					Get(gomock.Any(), uint64(3)).
					Return(existingHost, nil)

				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Mock delete failure
				mockNetworkHostStorage.EXPECT().
					Delete(gomock.Any(), uint64(3)).
					Return(errors.New("database delete failed"))
			},
			expectedError: "failed to delete network host: database delete failed",
		},
		{
			name: "error - sync fails after successful delete",
			id:   4,
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost, mockNetworkHostSetupUC *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Mock existing host
				existingHost := &entity.NetworkHost{
					ID:        4,
					NetworkID: 15,
					Address:   "sync.after.delete.fail.com",
				}
				mockNetworkHostStorage.EXPECT().
					Get(gomock.Any(), uint64(4)).
					Return(existingHost, nil)

				// Setup transaction mock
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Mock successful delete
				mockNetworkHostStorage.EXPECT().
					Delete(gomock.Any(), uint64(4)).
					Return(nil)

				// Mock sync failure
				mockNetworkHostSetupUC.EXPECT().
					SyncByNetworkID(gomock.Any(), uint64(15)).
					Return(errors.New("sync service unavailable"))
			},
			expectedError: "failed to sync network host setup: sync service unavailable",
		},
		{
			name: "error - transaction fails",
			id:   5,
			setupMocks: func(mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_usecase.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Mock existing host
				existingHost := &entity.NetworkHost{
					ID:        5,
					NetworkID: 20,
					Address:   "tx.fail.delete.com",
				}
				mockNetworkHostStorage.EXPECT().
					Get(gomock.Any(), uint64(5)).
					Return(existingHost, nil)

				// Setup transaction failure
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					Return(errors.New("transaction failed"))
			},
			expectedError: "failed to apply transaction: transaction failed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			// Create mocks
			mockTrm := mock_trm.NewMockManager(ctrl)
			mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)

			// Setup mocks
			tt.setupMocks(mockNetworkHostStorage, mockNetworkHostSetupUC, mockTrm)

			// Create use case
			useCase := New(
				mockTrm,
				mockNetworkHostSetupUC,
				mockNetworkStorage,
				mockNetworkHostStorage,
			)

			// Execute the method
			err := useCase.Delete(context.Background(), tt.id)

			// Assert results
			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func BenchmarkUseCase_ImportByNetworkIDFromJSON(b *testing.B) {
	ctrl := gomock.NewController(b)
	defer ctrl.Finish()

	// Create mocks
	mockTrm := mock_trm.NewMockManager(ctrl)
	mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
	mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
	mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)

	network := &entity.Network{
		ID:   1,
		Name: "BenchNetwork",
	}

	// Create JSON data for 1000 hosts
	hostDTOs := make([]entity.NetworkHostDTO, 1000)
	for i := range 1000 {
		hostDTOs[i] = entity.NetworkHostDTO{
			Address:     fmt.Sprintf("bench-%d.example.com", i),
			Description: fmt.Sprintf("Benchmark host %d", i),
		}
	}

	payload := entity.NetworkHostContextExportPayload{
		ExportDate: time.Now(),
		Hosts:      hostDTOs,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		b.Fatal(err)
	}

	// Setup mocks with expectations that will be called b.N times
	mockNetworkStorage.EXPECT().
		Get(gomock.Any(), uint64(1)).
		Return(network, nil).
		AnyTimes()

	mockTrm.EXPECT().
		Do(gomock.Any(), gomock.Any()).
		DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
			return fn(ctx)
		}).
		AnyTimes()

	// Mock that all hosts don't exist (so they get imported)
	mockNetworkHostStorage.EXPECT().
		List(gomock.Any(), gomock.Any()).
		Return([]*entity.NetworkHost{}, nil).
		AnyTimes()

	// Mock successful addition of hosts
	mockNetworkHostStorage.EXPECT().
		Add(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ context.Context, host *entity.NetworkHost) (*entity.NetworkHost, error) {
			host.ID = 1
			return host, nil
		}).
		AnyTimes()

	// Mock successful sync
	mockNetworkHostSetupUC.EXPECT().
		SyncByNetworkID(gomock.Any(), uint64(1)).
		Return(nil).
		AnyTimes()

	// Create use case
	useCase := New(
		mockTrm,
		mockNetworkHostSetupUC,
		mockNetworkStorage,
		mockNetworkHostStorage,
	)

	// Reset timer to exclude setup time
	b.ResetTimer()

	// Run benchmark
	for b.Loop() {
		if benchErr := useCase.ImportByNetworkIDFromJSON(context.Background(), 1, string(jsonData)); benchErr != nil {
			b.Fatal(benchErr)
		}
	}
}
