package networkhostsetup

import (
	"context"
	"errors"
	"net"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	"github.com/dmitrorlov/splitr/backend/entity"
	mock_storage "github.com/dmitrorlov/splitr/backend/mocks/storage"
	mock_trm "github.com/dmitrorlov/splitr/backend/mocks/trm"
	mock_usecase "github.com/dmitrorlov/splitr/backend/mocks/usecase"
	"github.com/dmitrorlov/splitr/backend/pkg/errs"
)

func TestNew(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockTrm := mock_trm.NewMockManager(ctrl)
	mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
	mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
	mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)
	mockNetworkHostSetupStorage := mock_storage.NewMockNetworkHostSetup(ctrl)

	useCase := New(
		mockTrm,
		mockCommandExecutor,
		mockNetworkStorage,
		mockNetworkHostStorage,
		mockNetworkHostSetupStorage,
	)

	assert.NotNil(t, useCase)
	assert.Equal(t, mockTrm, useCase.trm)
	assert.Equal(t, mockCommandExecutor, useCase.commandExecutorUC)
	assert.Equal(t, mockNetworkStorage, useCase.networkStorage)
	assert.Equal(t, mockNetworkHostStorage, useCase.networkHostStorage)
	assert.Equal(t, mockNetworkHostSetupStorage, useCase.networkHostSetupStorage)
}

func TestUseCase_SyncByNetworkID(t *testing.T) {
	tests := []struct {
		name          string
		networkID     uint64
		setupMocks    func(*mock_usecase.MockCommandExecutor, *mock_storage.MockNetwork, *mock_storage.MockNetworkHost, *mock_storage.MockNetworkHostSetup, *mock_trm.MockManager)
		expectedError string
	}{
		{
			name:      "successfully sync network routes for active network",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_storage.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				// Mock network retrieval
				network := &entity.Network{
					ID:   1,
					Name: "TestNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(network, nil)

				// Mock network hosts list (empty for simplicity)
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{1},
					}).
					Return([]*entity.NetworkHost{}, nil)

				// Mock getCurrentNetworkInfo chain - needed by listSetupsByNetwork
				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), entity.NetworkInterface("eth0")).
					Return(entity.NetworkService("service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), entity.NetworkService("service")).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)

				// Mock GetCurrentVPN to return the same network name (active network)
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService("TestNetwork"), nil)

				// Mock transaction manager
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						return fn(ctx)
					})

				// Mock command executor to be called with empty slice (no network hosts)
				mockCommandExecutor.EXPECT().
					SetNetworkAdditionalRoutes(gomock.Any(), network, []*entity.NetworkHostSetup{}).
					Return(nil)
			},
			expectedError: "",
		},
		{
			name:      "early return when network is not currently active VPN - storage/command executor mocks NOT invoked",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_storage.MockNetworkHostSetup, _ *mock_trm.MockManager) {
				// Mock network retrieval
				network := &entity.Network{
					ID:   1,
					Name: "TestNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(network, nil)

				// Mock network hosts list (empty for simplicity)
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{1},
					}).
					Return([]*entity.NetworkHost{}, nil)

				// Mock getCurrentNetworkInfo chain - needed by listSetupsByNetwork
				// This executes before the VPN check, so must be mocked
				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), entity.NetworkInterface("eth0")).
					Return(entity.NetworkService("service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), entity.NetworkService("service")).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)

				// Mock GetCurrentVPN to return a different network name (inactive network)
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService("DifferentNetwork"), nil)

				// Transaction manager and SetNetworkAdditionalRoutes should NOT be called
				// since we return early after VPN check. No expectations added means they should not be invoked.
			},
			expectedError: "", // Should return nil (no error) for successful no-op
		},
		{
			name:      "error when network not found",
			networkID: 1,
			setupMocks: func(_ *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, _ *mock_storage.MockNetworkHost, _ *mock_storage.MockNetworkHostSetup, _ *mock_trm.MockManager) {
				// Mock network retrieval failure
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(nil, errors.New("network not found"))
			},
			expectedError: "failed to get network by id 1: network not found",
		},
		{
			name:      "successful sync with non-empty network host setup list",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, mockNetworkHostSetupStorage *mock_storage.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				network := &entity.Network{ID: 1, Name: "TestNetwork"}
				networkHost := &entity.NetworkHost{ID: 1, NetworkID: 1, Address: "localhost"}

				mockNetworkStorage.EXPECT().Get(gomock.Any(), uint64(1)).Return(network, nil)
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return([]*entity.NetworkHost{networkHost}, nil)

				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), gomock.Any()).
					Return(entity.NetworkService("service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), gomock.Any()).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService("TestNetwork"), nil)

				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						// Mock successful database operations
						mockNetworkHostSetupStorage.EXPECT().
							DeleteBatchByNetworkHostIDs(gomock.Any(), []uint64{1}).
							Return(nil)
						mockNetworkHostSetupStorage.EXPECT().
							AddBatch(gomock.Any(), gomock.Any()).
							Return(nil)

						// Mock successful command execution
						mockCommandExecutor.EXPECT().
							SetNetworkAdditionalRoutes(gomock.Any(), network, gomock.Any()).
							Return(nil)

						return fn(ctx)
					})
			},
			expectedError: "",
		},
		{
			name:      "early return when VPN service not found",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_storage.MockNetworkHostSetup, _ *mock_trm.MockManager) {
				// Mock network retrieval
				network := &entity.Network{
					ID:   1,
					Name: "TestNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(network, nil)

				// Mock network hosts list
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListNetworkHostFilter{
						NetworkID: []uint64{1},
					}).
					Return([]*entity.NetworkHost{}, nil)

				// Mock getCurrentNetworkInfo chain - needed by listSetupsByNetwork
				// This executes before the VPN check, so must be mocked
				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), entity.NetworkInterface("eth0")).
					Return(entity.NetworkService("service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), entity.NetworkService("service")).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)

				// Mock GetCurrentVPN to return ErrVPNServiceNotFound (proper error from errs package)
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService(""), errs.ErrVPNServiceNotFound)

				// Transaction and command executor should NOT be called since we return early
			},
			expectedError: "", // Should return nil (no error) for successful no-op
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			// Create mocks
			mockTrm := mock_trm.NewMockManager(ctrl)
			mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)
			mockNetworkHostSetupStorage := mock_storage.NewMockNetworkHostSetup(ctrl)

			// Setup mocks
			tt.setupMocks(
				mockCommandExecutor,
				mockNetworkStorage,
				mockNetworkHostStorage,
				mockNetworkHostSetupStorage,
				mockTrm,
			)

			// Create use case
			useCase := New(
				mockTrm,
				mockCommandExecutor,
				mockNetworkStorage,
				mockNetworkHostStorage,
				mockNetworkHostSetupStorage,
			)

			// Execute the method
			err := useCase.SyncByNetworkID(context.Background(), tt.networkID)

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

func TestUseCase_ResetByNetworkID(t *testing.T) {
	tests := []struct {
		name          string
		networkID     uint64
		setupMocks    func(*mock_usecase.MockCommandExecutor, *mock_storage.MockNetwork)
		expectedError string
	}{
		{
			name:      "successfully reset network routes",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork) {
				// Mock network retrieval
				network := &entity.Network{
					ID:   1,
					Name: "TestNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(network, nil)

				// Mock GetCurrentVPN to return the same network name (active network)
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService("TestNetwork"), nil)

				// Mock command executor to be called with empty slice
				mockCommandExecutor.EXPECT().
					SetNetworkAdditionalRoutes(gomock.Any(), network, []*entity.NetworkHostSetup{}).
					Return(nil)
			},
			expectedError: "",
		},
		{
			name:      "error when network not found",
			networkID: 1,
			setupMocks: func(_ *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork) {
				// Mock network retrieval failure
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(nil, errors.New("network not found"))
			},
			expectedError: "failed to get network by id 1: network not found",
		},
		{
			name:      "error when command executor fails",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork) {
				// Mock network retrieval
				network := &entity.Network{
					ID:   1,
					Name: "TestNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(network, nil)

				// Mock GetCurrentVPN to return the same network name (active network)
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService("TestNetwork"), nil)

				// Mock command executor failure
				mockCommandExecutor.EXPECT().
					SetNetworkAdditionalRoutes(gomock.Any(), network, []*entity.NetworkHostSetup{}).
					Return(errors.New("command execution failed"))
			},
			expectedError: "failed to reset network additional routes: command execution failed",
		},
		{
			name:      "verify empty slice passed to command executor",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork) {
				// Mock network retrieval
				network := &entity.Network{
					ID:   1,
					Name: "TestNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(network, nil)

				// Mock GetCurrentVPN to return the same network name (active network)
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService("TestNetwork"), nil)

				// Verify that SetNetworkAdditionalRoutes is called with an empty slice
				mockCommandExecutor.EXPECT().
					SetNetworkAdditionalRoutes(
						gomock.Any(),
						network,
						gomock.Eq([]*entity.NetworkHostSetup{}), // explicitly verify empty slice
					).
					Return(nil)
			},
			expectedError: "",
		},
		{
			name:      "early return when VPN service not found",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork) {
				// Mock network retrieval
				network := &entity.Network{
					ID:   1,
					Name: "TestNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(network, nil)

				// Mock GetCurrentVPN to return ErrVPNServiceNotFound
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService(""), errors.New("vpn service not found"))
			},
			expectedError: "failed to get current VPN: vpn service not found",
		},
		{
			name:      "early return when VPN service not found with correct error",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork) {
				// Mock network retrieval
				network := &entity.Network{
					ID:   1,
					Name: "TestNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(network, nil)

				// Mock GetCurrentVPN to return ErrVPNServiceNotFound (proper error from errs package)
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService(""), errs.ErrVPNServiceNotFound)

				// SetNetworkAdditionalRoutes should NOT be called since we return early
				// No need to add expectation for this call
			},
			expectedError: "", // Should return nil (no error) for successful no-op
		},
		{
			name:      "early return when network is not currently active VPN",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork) {
				// Mock network retrieval
				network := &entity.Network{
					ID:   1,
					Name: "TestNetwork",
				}
				mockNetworkStorage.EXPECT().
					Get(gomock.Any(), uint64(1)).
					Return(network, nil)

				// Mock GetCurrentVPN to return a different network name
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService("DifferentNetwork"), nil)

				// SetNetworkAdditionalRoutes should NOT be called since we return early
				// No need to add expectation for this call
			},
			expectedError: "", // Should return nil (no error) for successful no-op
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			// Create mocks
			mockTrm := mock_trm.NewMockManager(ctrl)
			mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)
			mockNetworkHostSetupStorage := mock_storage.NewMockNetworkHostSetup(ctrl)

			// Setup mocks
			tt.setupMocks(mockCommandExecutor, mockNetworkStorage)

			// Create use case
			useCase := New(
				mockTrm,
				mockCommandExecutor,
				mockNetworkStorage,
				mockNetworkHostStorage,
				mockNetworkHostSetupStorage,
			)

			// Execute the method
			err := useCase.ResetByNetworkID(context.Background(), tt.networkID)

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

// Additional tests for uncovered code paths

func TestUseCase_SyncByNetworkID_TransactionErrors(t *testing.T) {
	tests := []struct {
		name          string
		networkID     uint64
		setupMocks    func(*mock_usecase.MockCommandExecutor, *mock_storage.MockNetwork, *mock_storage.MockNetworkHost, *mock_storage.MockNetworkHostSetup, *mock_trm.MockManager)
		expectedError string
	}{
		{
			name:      "transaction error during DeleteBatchByNetworkHostIDs",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, mockNetworkHostSetupStorage *mock_storage.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				network := &entity.Network{ID: 1, Name: "TestNetwork"}
				networkHost := &entity.NetworkHost{ID: 1, NetworkID: 1, Address: "example.com"}

				// Mock the complete chain to get to transaction
				mockNetworkStorage.EXPECT().Get(gomock.Any(), uint64(1)).Return(network, nil)
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return([]*entity.NetworkHost{networkHost}, nil)

				// Mock network info chain
				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), gomock.Any()).
					Return(entity.NetworkService("service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), gomock.Any()).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)

				// Mock VPN check
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService("TestNetwork"), nil)

				// Mock transaction with DeleteBatch error
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						// Inside transaction: DeleteBatch fails
						mockNetworkHostSetupStorage.EXPECT().
							DeleteBatchByNetworkHostIDs(gomock.Any(), gomock.Any()).
							Return(errors.New("delete batch failed"))
						return fn(ctx)
					})
			},
			expectedError: "failed to delete network host setup list by network host ids: delete batch failed",
		},
		{
			name:      "transaction error during AddBatch",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, mockNetworkHostSetupStorage *mock_storage.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				network := &entity.Network{ID: 1, Name: "TestNetwork"}
				networkHost := &entity.NetworkHost{ID: 1, NetworkID: 1, Address: "example.com"}

				mockNetworkStorage.EXPECT().Get(gomock.Any(), uint64(1)).Return(network, nil)
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return([]*entity.NetworkHost{networkHost}, nil)

				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), gomock.Any()).
					Return(entity.NetworkService("service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), gomock.Any()).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService("TestNetwork"), nil)

				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						// DeleteBatch succeeds, AddBatch fails
						mockNetworkHostSetupStorage.EXPECT().
							DeleteBatchByNetworkHostIDs(gomock.Any(), gomock.Any()).
							Return(nil)
						mockNetworkHostSetupStorage.EXPECT().
							AddBatch(gomock.Any(), gomock.Any()).
							Return(errors.New("add batch failed"))
						return fn(ctx)
					})
			},
			expectedError: "failed to add network host setup list: add batch failed",
		},
		{
			name:      "transaction error during SetNetworkAdditionalRoutes",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, mockNetworkHostSetupStorage *mock_storage.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				network := &entity.Network{ID: 1, Name: "TestNetwork"}
				networkHost := &entity.NetworkHost{ID: 1, NetworkID: 1, Address: "example.com"}

				mockNetworkStorage.EXPECT().Get(gomock.Any(), uint64(1)).Return(network, nil)
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return([]*entity.NetworkHost{networkHost}, nil)

				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), gomock.Any()).
					Return(entity.NetworkService("service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), gomock.Any()).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService("TestNetwork"), nil)

				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					DoAndReturn(func(ctx context.Context, fn func(context.Context) error) error {
						// Storage operations succeed, command executor fails
						mockNetworkHostSetupStorage.EXPECT().
							DeleteBatchByNetworkHostIDs(gomock.Any(), gomock.Any()).
							Return(nil)
						mockNetworkHostSetupStorage.EXPECT().
							AddBatch(gomock.Any(), gomock.Any()).
							Return(nil)
						mockCommandExecutor.EXPECT().
							SetNetworkAdditionalRoutes(gomock.Any(), network, gomock.Any()).
							Return(errors.New("command failed"))
						return fn(ctx)
					})
			},
			expectedError: "failed to set network additional routes: command failed",
		},
		{
			name:      "transaction Do method itself fails",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_storage.MockNetworkHostSetup, mockTrm *mock_trm.MockManager) {
				network := &entity.Network{ID: 1, Name: "TestNetwork"}

				mockNetworkStorage.EXPECT().Get(gomock.Any(), uint64(1)).Return(network, nil)
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return([]*entity.NetworkHost{}, nil)

				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), gomock.Any()).
					Return(entity.NetworkService("service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), gomock.Any()).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService("TestNetwork"), nil)

				// Transaction manager itself fails
				mockTrm.EXPECT().
					Do(gomock.Any(), gomock.Any()).
					Return(errors.New("transaction failed"))
			},
			expectedError: "failed to apply transaction: transaction failed",
		},
		{
			name:      "error from GetCurrentVPN that is not ErrVPNServiceNotFound",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost, _ *mock_storage.MockNetworkHostSetup, _ *mock_trm.MockManager) {
				network := &entity.Network{ID: 1, Name: "TestNetwork"}

				mockNetworkStorage.EXPECT().Get(gomock.Any(), uint64(1)).Return(network, nil)
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return([]*entity.NetworkHost{}, nil)

				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), gomock.Any()).
					Return(entity.NetworkService("service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), gomock.Any()).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)

				// Return a different error (not ErrVPNServiceNotFound)
				mockCommandExecutor.EXPECT().
					GetCurrentVPN(gomock.Any()).
					Return(entity.VPNService(""), errors.New("some other VPN error"))
			},
			expectedError: "failed to get current VPN: some other VPN error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockTrm := mock_trm.NewMockManager(ctrl)
			mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)
			mockNetworkHostSetupStorage := mock_storage.NewMockNetworkHostSetup(ctrl)

			tt.setupMocks(
				mockCommandExecutor,
				mockNetworkStorage,
				mockNetworkHostStorage,
				mockNetworkHostSetupStorage,
				mockTrm,
			)

			useCase := New(
				mockTrm,
				mockCommandExecutor,
				mockNetworkStorage,
				mockNetworkHostStorage,
				mockNetworkHostSetupStorage,
			)

			err := useCase.SyncByNetworkID(context.Background(), tt.networkID)

			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.expectedError)
		})
	}
}

func TestUseCase_listNetworkAndSetupsByNetworkID(t *testing.T) {
	tests := []struct {
		name           string
		networkID      uint64
		setupMocks     func(*mock_usecase.MockCommandExecutor, *mock_storage.MockNetwork, *mock_storage.MockNetworkHost)
		expectedError  string
		expectedResult bool
	}{
		{
			name:      "error from listSetupsByNetwork - networkHost storage error",
			networkID: 1,
			setupMocks: func(_ *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				network := &entity.Network{ID: 1, Name: "TestNetwork"}
				mockNetworkStorage.EXPECT().Get(gomock.Any(), uint64(1)).Return(network, nil)
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return(nil, errors.New("storage error"))
			},
			expectedError:  "failed to list network hosts: storage error",
			expectedResult: false,
		},
		{
			name:      "error from getCurrentNetworkInfo",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				network := &entity.Network{ID: 1, Name: "TestNetwork"}
				mockNetworkStorage.EXPECT().Get(gomock.Any(), uint64(1)).Return(network, nil)
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return([]*entity.NetworkHost{}, nil)

				// GetDefaultNetworkInterface fails
				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface(""), errors.New("interface error"))
			},
			expectedError:  "failed to get current network info: failed to get default network interface: interface error",
			expectedResult: false,
		},
		{
			name:      "successful execution",
			networkID: 1,
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkStorage *mock_storage.MockNetwork, mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				network := &entity.Network{ID: 1, Name: "TestNetwork"}
				mockNetworkStorage.EXPECT().Get(gomock.Any(), uint64(1)).Return(network, nil)
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return([]*entity.NetworkHost{}, nil)

				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), gomock.Any()).
					Return(entity.NetworkService("service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), gomock.Any()).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)
			},
			expectedResult: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockTrm := mock_trm.NewMockManager(ctrl)
			mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)
			mockNetworkHostSetupStorage := mock_storage.NewMockNetworkHostSetup(ctrl)

			tt.setupMocks(mockCommandExecutor, mockNetworkStorage, mockNetworkHostStorage)

			useCase := New(
				mockTrm,
				mockCommandExecutor,
				mockNetworkStorage,
				mockNetworkHostStorage,
				mockNetworkHostSetupStorage,
			)

			network, setups, err := useCase.listNetworkAndSetupsByNetworkID(
				context.Background(),
				tt.networkID,
			)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, network)
				assert.Nil(t, setups)
			} else if tt.expectedResult {
				require.NoError(t, err)
				assert.NotNil(t, network)
				assert.NotNil(t, setups)
			}
		})
	}
}

func TestUseCase_getCurrentNetworkInfo(t *testing.T) {
	tests := []struct {
		name          string
		setupMocks    func(*mock_usecase.MockCommandExecutor)
		expectedError string
		expectedInfo  *entity.NetworkInfo
	}{
		{
			name: "error from GetDefaultNetworkInterface",
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor) {
				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface(""), errors.New("interface error"))
			},
			expectedError: "failed to get default network interface: interface error",
		},
		{
			name: "error from GetNetworkServiceByNetworkInterface",
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor) {
				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), entity.NetworkInterface("eth0")).
					Return(entity.NetworkService(""), errors.New("service error"))
			},
			expectedError: "failed to get network service by network interface eth0: service error",
		},
		{
			name: "error from GetNetworkInfoByNetworkService",
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor) {
				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), entity.NetworkInterface("eth0")).
					Return(entity.NetworkService("test-service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), entity.NetworkService("test-service")).
					Return(nil, errors.New("network info error"))
			},
			expectedError: "failed to get network info by network service test-service: network info error",
		},
		{
			name: "successful execution",
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor) {
				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), entity.NetworkInterface("eth0")).
					Return(entity.NetworkService("test-service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), entity.NetworkService("test-service")).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)
			},
			expectedInfo: &entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockTrm := mock_trm.NewMockManager(ctrl)
			mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)
			mockNetworkHostSetupStorage := mock_storage.NewMockNetworkHostSetup(ctrl)

			tt.setupMocks(mockCommandExecutor)

			useCase := New(
				mockTrm,
				mockCommandExecutor,
				mockNetworkStorage,
				mockNetworkHostStorage,
				mockNetworkHostSetupStorage,
			)

			result, err := useCase.getCurrentNetworkInfo(context.Background())

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectedInfo, result)
			}
		})
	}
}

func TestUseCase_listIPByAddress(t *testing.T) {
	// Create a test use case instance for testing the private method
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockTrm := mock_trm.NewMockManager(ctrl)
	mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
	mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
	mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)
	mockNetworkHostSetupStorage := mock_storage.NewMockNetworkHostSetup(ctrl)

	useCase := New(
		mockTrm,
		mockCommandExecutor,
		mockNetworkStorage,
		mockNetworkHostStorage,
		mockNetworkHostSetupStorage,
	)

	t.Run("successful IPv4 filtering", func(t *testing.T) {
		// Test with a real domain that should resolve to IPv4
		ips, err := useCase.listIPByAddress(context.Background(), "google.com")
		require.NoError(t, err)
		assert.NotEmpty(t, ips)

		// Verify all returned IPs are IPv4
		for _, ip := range ips {
			parsedIP := net.ParseIP(ip)
			assert.NotNil(t, parsedIP, "IP should be valid: %s", ip)
			assert.NotNil(t, parsedIP.To4(), "IP should be IPv4: %s", ip)
		}
	})

	t.Run("DNS lookup failure", func(t *testing.T) {
		// Use an invalid domain that should fail DNS lookup
		ips, err := useCase.listIPByAddress(
			context.Background(),
			"this-domain-should-not-exist-12345.invalid",
		)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "failed to lookup IP for address")
		assert.Nil(t, ips)
	})

	t.Run("no IPv4 addresses found", func(t *testing.T) {
		// This is harder to test reliably since most domains have IPv4.
		// We'll test with localhost which should always resolve
		ips, err := useCase.listIPByAddress(context.Background(), "localhost")

		// localhost should resolve to at least IPv4 loopback
		if err != nil {
			// If there's an error, it should be about no IPv4 addresses
			assert.Contains(t, err.Error(), "no IPv4 addresses found")
		} else {
			// If successful, should have IPv4 addresses
			assert.NotEmpty(t, ips)
		}
	})
}

func TestUseCase_listSetupsByNetwork_WithHosts(t *testing.T) {
	tests := []struct {
		name          string
		setupMocks    func(*mock_usecase.MockCommandExecutor, *mock_storage.MockNetworkHost)
		expectedError string
		network       *entity.Network
		verifyResult  func([]*entity.NetworkHostSetup)
	}{
		{
			name: "successful with real network hosts and IP resolution",
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				networkHosts := []*entity.NetworkHost{
					{ID: 1, NetworkID: 1, Address: "google.com"},
					{ID: 2, NetworkID: 1, Address: "github.com"},
				}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return(networkHosts, nil)

				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), gomock.Any()).
					Return(entity.NetworkService("service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), gomock.Any()).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)
			},
			network: &entity.Network{ID: 1, Name: "TestNetwork"},
			verifyResult: func(setups []*entity.NetworkHostSetup) {
				// Should have at least some setups from the two domains
				assert.NotEmpty(t, setups)

				// Verify setups have correct network info
				for _, setup := range setups {
					assert.Equal(t, "255.255.255.0", setup.SubnetMask)
					assert.Equal(t, "192.168.1.1", setup.Router)
					assert.True(t, setup.NetworkHostID == 1 || setup.NetworkHostID == 2)

					// Verify IP is valid IPv4
					parsedIP := net.ParseIP(setup.NetworkHostIP)
					assert.NotNil(t, parsedIP)
					assert.NotNil(t, parsedIP.To4())
				}
			},
		},
		{
			name: "error from listIPByAddress",
			setupMocks: func(mockCommandExecutor *mock_usecase.MockCommandExecutor, mockNetworkHostStorage *mock_storage.MockNetworkHost) {
				networkHosts := []*entity.NetworkHost{
					{ID: 1, NetworkID: 1, Address: "invalid-domain-12345.invalid"},
				}
				mockNetworkHostStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return(networkHosts, nil)

				mockCommandExecutor.EXPECT().
					GetDefaultNetworkInterface(gomock.Any()).
					Return(entity.NetworkInterface("eth0"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkServiceByNetworkInterface(gomock.Any(), gomock.Any()).
					Return(entity.NetworkService("service"), nil)
				mockCommandExecutor.EXPECT().
					GetNetworkInfoByNetworkService(gomock.Any(), gomock.Any()).
					Return(&entity.NetworkInfo{SubnetMask: "255.255.255.0", Router: "192.168.1.1"}, nil)
			},
			network:       &entity.Network{ID: 1, Name: "TestNetwork"},
			expectedError: "failed to list IP by address invalid-domain-12345.invalid",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockTrm := mock_trm.NewMockManager(ctrl)
			mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostStorage := mock_storage.NewMockNetworkHost(ctrl)
			mockNetworkHostSetupStorage := mock_storage.NewMockNetworkHostSetup(ctrl)

			tt.setupMocks(mockCommandExecutor, mockNetworkHostStorage)

			useCase := New(
				mockTrm,
				mockCommandExecutor,
				mockNetworkStorage,
				mockNetworkHostStorage,
				mockNetworkHostSetupStorage,
			)

			setups, err := useCase.listSetupsByNetwork(context.Background(), tt.network)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
			} else {
				assert.NoError(t, err)
				if tt.verifyResult != nil {
					tt.verifyResult(setups)
				}
			}
		})
	}
}
