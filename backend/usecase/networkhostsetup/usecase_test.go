package networkhostsetup

import (
	"context"
	"errors"
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
