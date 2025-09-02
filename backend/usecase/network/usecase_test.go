package network

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	"github.com/dmitrorlov/splitr/backend/entity"
	mock_storage "github.com/dmitrorlov/splitr/backend/mocks/storage"
	mock_usecase "github.com/dmitrorlov/splitr/backend/mocks/usecase"
	"github.com/dmitrorlov/splitr/backend/pkg/errs"
)

func TestNew(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
	mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
	mockNetworkHostSetup := mock_usecase.NewMockNetworkHostSetup(ctrl)

	useCase := New(mockCommandExecutor, mockNetworkStorage, mockNetworkHostSetup)

	assert.NotNil(t, useCase)
	assert.Equal(t, mockCommandExecutor, useCase.commandExecutorUC)
	assert.Equal(t, mockNetworkStorage, useCase.networkStorage)
	assert.Equal(t, mockNetworkHostSetup, useCase.networkHostSetupUC)
}

func TestUseCase_Add(t *testing.T) {
	tests := []struct {
		name           string
		setupMocks     func(*mock_storage.MockNetwork)
		inputNetwork   *entity.Network
		expectedResult *entity.Network
		expectedError  string
	}{
		{
			name: "successful add",
			setupMocks: func(mockStorage *mock_storage.MockNetwork) {
				expectedNetwork := &entity.Network{
					ID:        1,
					Name:      "TestNetwork",
					CreatedAt: entity.TimestampFromTime(time.Now()),
				}
				mockStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(expectedNetwork, nil)
			},
			inputNetwork: &entity.Network{Name: "TestNetwork"},
			expectedResult: &entity.Network{
				ID:        1,
				Name:      "TestNetwork",
				CreatedAt: entity.TimestampFromTime(time.Now()),
			},
		},
		{
			name: "storage error",
			setupMocks: func(mockStorage *mock_storage.MockNetwork) {
				mockStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(nil, errors.New("storage error"))
			},
			inputNetwork:  &entity.Network{Name: "TestNetwork"},
			expectedError: "storage error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostSetup := mock_usecase.NewMockNetworkHostSetup(ctrl)

			tt.setupMocks(mockNetworkStorage)

			useCase := New(mockCommandExecutor, mockNetworkStorage, mockNetworkHostSetup)

			result, err := useCase.Add(context.Background(), tt.inputNetwork)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectedResult.ID, result.ID)
				assert.Equal(t, tt.expectedResult.Name, result.Name)
				assert.NotZero(t, result.CreatedAt)
			}
		})
	}
}

func TestUseCase_List_Errors(t *testing.T) {
	tests := []struct {
		name          string
		setupMocks    func(*mock_storage.MockNetwork, *mock_usecase.MockCommandExecutor)
		expectedError string
	}{
		{
			name: "storage list error",
			setupMocks: func(mockStorage *mock_storage.MockNetwork, _ *mock_usecase.MockCommandExecutor) {
				mockStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return(nil, errors.New("storage error"))
			},
			expectedError: "failed to list networks: storage error",
		},
		{
			name: "GetCurrentVPN non-ErrVPNServiceNotFound error",
			setupMocks: func(mockStorage *mock_storage.MockNetwork, mockExecutor *mock_usecase.MockCommandExecutor) {
				networks := []*entity.Network{
					{ID: 1, Name: "Network1"},
				}
				mockStorage.EXPECT().
					List(gomock.Any(), gomock.Any()).
					Return(networks, nil)

				mockExecutor.EXPECT().
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

			mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostSetup := mock_usecase.NewMockNetworkHostSetup(ctrl)

			tt.setupMocks(mockNetworkStorage, mockCommandExecutor)

			useCase := New(mockCommandExecutor, mockNetworkStorage, mockNetworkHostSetup)

			result, err := useCase.List(context.Background(), &entity.ListNetworkFilter{})

			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.expectedError)
			assert.Nil(t, result)
		})
	}
}

func TestUseCase_List_WithErrVPNServiceNotFound(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
	mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
	mockNetworkHostSetup := mock_usecase.NewMockNetworkHostSetup(ctrl)

	networks := []*entity.Network{
		{ID: 1, Name: "Network1"},
		{ID: 2, Name: "Network2"},
	}

	mockNetworkStorage.EXPECT().
		List(gomock.Any(), gomock.Any()).
		Return(networks, nil)

	mockCommandExecutor.EXPECT().
		GetCurrentVPN(gomock.Any()).
		Return(entity.VPNService(""), errs.ErrVPNServiceNotFound)

	useCase := New(mockCommandExecutor, mockNetworkStorage, mockNetworkHostSetup)

	result, err := useCase.List(context.Background(), &entity.ListNetworkFilter{})

	require.NoError(t, err)
	assert.Len(t, result, 2)

	assert.Equal(t, networks[0].ID, result[0].Network.ID)
	assert.Equal(t, networks[0].Name, result[0].Network.Name)
	assert.False(t, result[0].IsActive)

	assert.Equal(t, networks[1].ID, result[1].Network.ID)
	assert.Equal(t, networks[1].Name, result[1].Network.Name)
	assert.False(t, result[1].IsActive)
}

func TestUseCase_List_WithActiveVPN(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
	mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
	mockNetworkHostSetup := mock_usecase.NewMockNetworkHostSetup(ctrl)

	networks := []*entity.Network{
		{ID: 1, Name: "Network1"},
		{ID: 2, Name: "ActiveNetwork"},
		{ID: 3, Name: "Network3"},
	}

	mockNetworkStorage.EXPECT().
		List(gomock.Any(), gomock.Any()).
		Return(networks, nil)

	mockCommandExecutor.EXPECT().
		GetCurrentVPN(gomock.Any()).
		Return(entity.VPNService("ActiveNetwork"), nil)

	useCase := New(mockCommandExecutor, mockNetworkStorage, mockNetworkHostSetup)

	result, err := useCase.List(context.Background(), &entity.ListNetworkFilter{})

	require.NoError(t, err)
	assert.Len(t, result, 3)

	assert.Equal(t, networks[0].ID, result[0].Network.ID)
	assert.Equal(t, networks[0].Name, result[0].Network.Name)
	assert.False(t, result[0].IsActive)

	assert.Equal(t, networks[1].ID, result[1].Network.ID)
	assert.Equal(t, networks[1].Name, result[1].Network.Name)
	assert.True(t, result[1].IsActive)

	assert.Equal(t, networks[2].ID, result[2].Network.ID)
	assert.Equal(t, networks[2].Name, result[2].Network.Name)
	assert.False(t, result[2].IsActive)
}

func TestUseCase_List_WithEmptyNetworks(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
	mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
	mockNetworkHostSetup := mock_usecase.NewMockNetworkHostSetup(ctrl)

	mockNetworkStorage.EXPECT().
		List(gomock.Any(), gomock.Any()).
		Return([]*entity.Network{}, nil)

	mockCommandExecutor.EXPECT().
		GetCurrentVPN(gomock.Any()).
		Return(entity.VPNService("SomeVPN"), nil)

	useCase := New(mockCommandExecutor, mockNetworkStorage, mockNetworkHostSetup)

	result, err := useCase.List(context.Background(), &entity.ListNetworkFilter{})

	require.NoError(t, err)
	assert.Empty(t, result)
}

func TestUseCase_Delete(t *testing.T) {
	tests := []struct {
		name          string
		setupMocks    func(*mock_usecase.MockNetworkHostSetup, *mock_storage.MockNetwork)
		networkID     uint64
		expectedError string
	}{
		{
			name: "ResetByNetworkID error",
			setupMocks: func(mockHostSetup *mock_usecase.MockNetworkHostSetup, _ *mock_storage.MockNetwork) {
				mockHostSetup.EXPECT().
					ResetByNetworkID(gomock.Any(), uint64(1)).
					Return(errors.New("reset error"))
			},
			networkID:     1,
			expectedError: "failed to reset network host setup: reset error",
		},
		{
			name: "storage delete error after successful reset",
			setupMocks: func(mockHostSetup *mock_usecase.MockNetworkHostSetup, mockStorage *mock_storage.MockNetwork) {
				gomock.InOrder(
					mockHostSetup.EXPECT().
						ResetByNetworkID(gomock.Any(), uint64(2)).
						Return(nil),
					mockStorage.EXPECT().
						Delete(gomock.Any(), uint64(2)).
						Return(errors.New("delete error")),
				)
			},
			networkID:     2,
			expectedError: "delete error",
		},
		{
			name: "successful delete",
			setupMocks: func(mockHostSetup *mock_usecase.MockNetworkHostSetup, mockStorage *mock_storage.MockNetwork) {
				gomock.InOrder(
					mockHostSetup.EXPECT().
						ResetByNetworkID(gomock.Any(), uint64(3)).
						Return(nil),
					mockStorage.EXPECT().
						Delete(gomock.Any(), uint64(3)).
						Return(nil),
				)
			},
			networkID: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostSetup := mock_usecase.NewMockNetworkHostSetup(ctrl)

			tt.setupMocks(mockNetworkHostSetup, mockNetworkStorage)

			useCase := New(mockCommandExecutor, mockNetworkStorage, mockNetworkHostSetup)

			err := useCase.Delete(context.Background(), tt.networkID)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestUseCase_ListVPNServices(t *testing.T) {
	tests := []struct {
		name           string
		setupMocks     func(*mock_usecase.MockCommandExecutor)
		expectedResult []entity.VPNService
		expectedError  string
	}{
		{
			name: "successful list",
			setupMocks: func(mockExecutor *mock_usecase.MockCommandExecutor) {
				vpnServices := []entity.VPNService{
					entity.VPNService("VPN1"),
					entity.VPNService("VPN2"),
					entity.VPNService("VPN3"),
				}
				mockExecutor.EXPECT().
					ListVPN(gomock.Any()).
					Return(vpnServices, nil)
			},
			expectedResult: []entity.VPNService{
				entity.VPNService("VPN1"),
				entity.VPNService("VPN2"),
				entity.VPNService("VPN3"),
			},
		},
		{
			name: "command executor error",
			setupMocks: func(mockExecutor *mock_usecase.MockCommandExecutor) {
				mockExecutor.EXPECT().
					ListVPN(gomock.Any()).
					Return(nil, errors.New("command error"))
			},
			expectedError: "failed to list VPN: command error",
		},
		{
			name: "empty VPN list",
			setupMocks: func(mockExecutor *mock_usecase.MockCommandExecutor) {
				mockExecutor.EXPECT().
					ListVPN(gomock.Any()).
					Return([]entity.VPNService{}, nil)
			},
			expectedResult: []entity.VPNService{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
			mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
			mockNetworkHostSetup := mock_usecase.NewMockNetworkHostSetup(ctrl)

			tt.setupMocks(mockCommandExecutor)

			useCase := New(mockCommandExecutor, mockNetworkStorage, mockNetworkHostSetup)

			result, err := useCase.ListVPNServices(context.Background())

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectedResult, result)
			}
		})
	}
}

func TestUseCase_List_WithNilFilter(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
	mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
	mockNetworkHostSetup := mock_usecase.NewMockNetworkHostSetup(ctrl)

	networks := []*entity.Network{
		{ID: 1, Name: "Network1"},
	}

	mockNetworkStorage.EXPECT().
		List(gomock.Any(), nil).
		Return(networks, nil)

	mockCommandExecutor.EXPECT().
		GetCurrentVPN(gomock.Any()).
		Return(entity.VPNService("Network1"), nil)

	useCase := New(mockCommandExecutor, mockNetworkStorage, mockNetworkHostSetup)

	result, err := useCase.List(context.Background(), nil)

	require.NoError(t, err)
	assert.Len(t, result, 1)
	assert.True(t, result[0].IsActive)
}

func TestUseCase_List_WithFilters(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockCommandExecutor := mock_usecase.NewMockCommandExecutor(ctrl)
	mockNetworkStorage := mock_storage.NewMockNetwork(ctrl)
	mockNetworkHostSetup := mock_usecase.NewMockNetworkHostSetup(ctrl)

	filter := &entity.ListNetworkFilter{
		ID:     []uint64{1, 2},
		Name:   []string{"Network1"},
		Search: "test",
	}

	networks := []*entity.Network{
		{ID: 1, Name: "Network1"},
	}

	mockNetworkStorage.EXPECT().
		List(gomock.Any(), filter).
		Return(networks, nil)

	mockCommandExecutor.EXPECT().
		GetCurrentVPN(gomock.Any()).
		Return(entity.VPNService("DifferentVPN"), nil)

	useCase := New(mockCommandExecutor, mockNetworkStorage, mockNetworkHostSetup)

	result, err := useCase.List(context.Background(), filter)

	require.NoError(t, err)
	assert.Len(t, result, 1)
	assert.False(t, result[0].IsActive)
}
