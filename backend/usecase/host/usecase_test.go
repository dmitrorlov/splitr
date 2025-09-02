package host

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	"github.com/dmitrorlov/splitr/backend/entity"
	mock_storage "github.com/dmitrorlov/splitr/backend/mocks/storage"
)

type contextKey string

func TestNew(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockHostStorage := mock_storage.NewMockHost(ctrl)

	useCase := New(mockHostStorage)

	require.NotNil(t, useCase)
	assert.NotNil(t, useCase.hostStorage)
}

func TestUseCase_Add(t *testing.T) {
	tests := []struct {
		name          string
		host          *entity.Host
		setupMocks    func(*mock_storage.MockHost)
		expectedHost  *entity.Host
		expectedError string
	}{
		{
			name: "successfully add host with description",
			host: &entity.Host{
				Address:     "192.168.1.100",
				Description: stringPtr("Web server"),
			},
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				addedHost := &entity.Host{
					ID:          1,
					Address:     "192.168.1.100",
					Description: stringPtr("Web server"),
				}
				mockHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(addedHost, nil)
			},
			expectedHost: &entity.Host{
				ID:          1,
				Address:     "192.168.1.100",
				Description: stringPtr("Web server"),
			},
		},
		{
			name: "successfully add host without description",
			host: &entity.Host{
				Address: "example.com",
			},
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				addedHost := &entity.Host{
					ID:      2,
					Address: "example.com",
				}
				mockHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(addedHost, nil)
			},
			expectedHost: &entity.Host{
				ID:      2,
				Address: "example.com",
			},
		},
		{
			name: "error - storage add fails",
			host: &entity.Host{
				Address: "test.com",
			},
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				mockHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(nil, errors.New("database connection failed"))
			},
			expectedError: "database connection failed",
		},
		{
			name: "error - storage returns specific error",
			host: &entity.Host{
				Address: "duplicate.com",
			},
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				mockHostStorage.EXPECT().
					Add(gomock.Any(), gomock.Any()).
					Return(nil, errors.New("host already exists"))
			},
			expectedError: "host already exists",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockHostStorage := mock_storage.NewMockHost(ctrl)
			tt.setupMocks(mockHostStorage)

			useCase := New(mockHostStorage)

			result, err := useCase.Add(context.Background(), tt.host)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, tt.expectedHost.ID, result.ID)
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

func TestUseCase_List(t *testing.T) {
	tests := []struct {
		name           string
		filter         *entity.ListHostFilter
		setupMocks     func(*mock_storage.MockHost)
		expectedResult []*entity.Host
		expectedError  string
	}{
		{
			name:   "successfully list all hosts with nil filter",
			filter: nil,
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				hosts := []*entity.Host{
					{
						ID:          1,
						Address:     "192.168.1.100",
						Description: stringPtr("Web server"),
					},
					{
						ID:      2,
						Address: "example.com",
					},
				}
				mockHostStorage.EXPECT().
					List(gomock.Any(), (*entity.ListHostFilter)(nil)).
					Return(hosts, nil)
			},
			expectedResult: []*entity.Host{
				{
					ID:          1,
					Address:     "192.168.1.100",
					Description: stringPtr("Web server"),
				},
				{
					ID:      2,
					Address: "example.com",
				},
			},
		},
		{
			name:   "successfully list all hosts with empty filter",
			filter: &entity.ListHostFilter{},
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				hosts := []*entity.Host{
					{
						ID:      3,
						Address: "test.local",
					},
				}
				mockHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListHostFilter{}).
					Return(hosts, nil)
			},
			expectedResult: []*entity.Host{
				{
					ID:      3,
					Address: "test.local",
				},
			},
		},
		{
			name: "successfully filter by search term",
			filter: &entity.ListHostFilter{
				Search: "web",
			},
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				hosts := []*entity.Host{
					{
						ID:          4,
						Address:     "webserver.local",
						Description: stringPtr("Web application server"),
					},
				}
				mockHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListHostFilter{
						Search: "web",
					}).
					Return(hosts, nil)
			},
			expectedResult: []*entity.Host{
				{
					ID:          4,
					Address:     "webserver.local",
					Description: stringPtr("Web application server"),
				},
			},
		},
		{
			name: "successfully filter by ID list",
			filter: &entity.ListHostFilter{
				ID: []uint64{10, 20},
			},
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				hosts := []*entity.Host{
					{
						ID:      10,
						Address: "host1.com",
					},
					{
						ID:      20,
						Address: "host2.com",
					},
				}
				mockHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListHostFilter{
						ID: []uint64{10, 20},
					}).
					Return(hosts, nil)
			},
			expectedResult: []*entity.Host{
				{
					ID:      10,
					Address: "host1.com",
				},
				{
					ID:      20,
					Address: "host2.com",
				},
			},
		},
		{
			name: "successfully filter by search and ID",
			filter: &entity.ListHostFilter{
				ID:     []uint64{5},
				Search: "api",
			},
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				hosts := []*entity.Host{
					{
						ID:      5,
						Address: "api.example.com",
					},
				}
				mockHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListHostFilter{
						ID:     []uint64{5},
						Search: "api",
					}).
					Return(hosts, nil)
			},
			expectedResult: []*entity.Host{
				{
					ID:      5,
					Address: "api.example.com",
				},
			},
		},
		{
			name:   "successfully return empty list",
			filter: &entity.ListHostFilter{},
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				mockHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListHostFilter{}).
					Return([]*entity.Host{}, nil)
			},
			expectedResult: []*entity.Host{},
		},
		{
			name: "error - storage list fails",
			filter: &entity.ListHostFilter{
				Search: "nonexistent",
			},
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				mockHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListHostFilter{
						Search: "nonexistent",
					}).
					Return(nil, errors.New("database query failed"))
			},
			expectedError: "database query failed",
		},
		{
			name: "error - storage returns connection error",
			filter: &entity.ListHostFilter{
				ID: []uint64{999},
			},
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				mockHostStorage.EXPECT().
					List(gomock.Any(), &entity.ListHostFilter{
						ID: []uint64{999},
					}).
					Return(nil, errors.New("connection timeout"))
			},
			expectedError: "connection timeout",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockHostStorage := mock_storage.NewMockHost(ctrl)
			tt.setupMocks(mockHostStorage)

			useCase := New(mockHostStorage)

			result, err := useCase.List(context.Background(), tt.filter)

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
		hostID        uint64
		setupMocks    func(*mock_storage.MockHost)
		expectedError string
	}{
		{
			name:   "successfully delete host",
			hostID: 1,
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				mockHostStorage.EXPECT().
					Delete(gomock.Any(), uint64(1)).
					Return(nil)
			},
		},
		{
			name:   "successfully delete host with different ID",
			hostID: 999,
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				mockHostStorage.EXPECT().
					Delete(gomock.Any(), uint64(999)).
					Return(nil)
			},
		},
		{
			name:   "error - storage delete fails",
			hostID: 2,
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				mockHostStorage.EXPECT().
					Delete(gomock.Any(), uint64(2)).
					Return(errors.New("database delete failed"))
			},
			expectedError: "database delete failed",
		},
		{
			name:   "error - host not found",
			hostID: 404,
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				mockHostStorage.EXPECT().
					Delete(gomock.Any(), uint64(404)).
					Return(errors.New("host not found"))
			},
			expectedError: "host not found",
		},
		{
			name:   "error - database connection error",
			hostID: 5,
			setupMocks: func(mockHostStorage *mock_storage.MockHost) {
				mockHostStorage.EXPECT().
					Delete(gomock.Any(), uint64(5)).
					Return(errors.New("connection lost"))
			},
			expectedError: "connection lost",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockHostStorage := mock_storage.NewMockHost(ctrl)
			tt.setupMocks(mockHostStorage)

			useCase := New(mockHostStorage)

			err := useCase.Delete(context.Background(), tt.hostID)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestUseCase_Methods_Context_Propagation(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockHostStorage := mock_storage.NewMockHost(ctrl)
	useCase := New(mockHostStorage)

	testCtx := context.WithValue(context.Background(), contextKey("test"), "value")

	t.Run("Add propagates context", func(t *testing.T) {
		host := &entity.Host{Address: "test.com"}
		mockHostStorage.EXPECT().
			Add(gomock.Eq(testCtx), gomock.Any()).
			Return(&entity.Host{ID: 1, Address: "test.com"}, nil)

		_, err := useCase.Add(testCtx, host)
		assert.NoError(t, err)
	})

	t.Run("List propagates context", func(t *testing.T) {
		filter := &entity.ListHostFilter{Search: "test"}
		mockHostStorage.EXPECT().
			List(gomock.Eq(testCtx), filter).
			Return([]*entity.Host{}, nil)

		_, err := useCase.List(testCtx, filter)
		assert.NoError(t, err)
	})

	t.Run("Delete propagates context", func(t *testing.T) {
		mockHostStorage.EXPECT().
			Delete(gomock.Eq(testCtx), uint64(1)).
			Return(nil)

		err := useCase.Delete(testCtx, 1)
		assert.NoError(t, err)
	})
}

func TestUseCase_Argument_Passing(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockHostStorage := mock_storage.NewMockHost(ctrl)
	useCase := New(mockHostStorage)

	t.Run("Add passes correct host", func(t *testing.T) {
		inputHost := &entity.Host{
			Address:     "exact.com",
			Description: stringPtr("exact description"),
		}

		mockHostStorage.EXPECT().
			Add(gomock.Any(), gomock.Eq(inputHost)).
			Return(&entity.Host{ID: 1, Address: "exact.com"}, nil)

		_, err := useCase.Add(context.Background(), inputHost)
		assert.NoError(t, err)
	})

	t.Run("List passes correct filter", func(t *testing.T) {
		inputFilter := &entity.ListHostFilter{
			ID:     []uint64{1, 2, 3},
			Search: "specific search",
		}

		mockHostStorage.EXPECT().
			List(gomock.Any(), gomock.Eq(inputFilter)).
			Return([]*entity.Host{}, nil)

		_, err := useCase.List(context.Background(), inputFilter)
		assert.NoError(t, err)
	})

	t.Run("Delete passes correct ID", func(t *testing.T) {
		targetID := uint64(42)

		mockHostStorage.EXPECT().
			Delete(gomock.Any(), gomock.Eq(targetID)).
			Return(nil)

		err := useCase.Delete(context.Background(), targetID)
		assert.NoError(t, err)
	})
}

func TestUseCase_Edge_Cases(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockHostStorage := mock_storage.NewMockHost(ctrl)
	useCase := New(mockHostStorage)

	t.Run("Add with nil host - storage handles it", func(t *testing.T) {
		mockHostStorage.EXPECT().
			Add(gomock.Any(), (*entity.Host)(nil)).
			Return(nil, errors.New("invalid host"))

		result, err := useCase.Add(context.Background(), nil)
		require.Error(t, err)
		assert.Nil(t, result)
	})

	t.Run("List with various filter combinations", func(t *testing.T) {
		emptyFilter := &entity.ListHostFilter{}
		mockHostStorage.EXPECT().
			List(gomock.Any(), emptyFilter).
			Return([]*entity.Host{}, nil)

		result, err := useCase.List(context.Background(), emptyFilter)
		require.NoError(t, err)
		assert.Empty(t, result)
	})

	t.Run("Delete with zero ID", func(t *testing.T) {
		mockHostStorage.EXPECT().
			Delete(gomock.Any(), uint64(0)).
			Return(nil)

		err := useCase.Delete(context.Background(), 0)
		assert.NoError(t, err)
	})
}

// stringPtr is a helper function to create string pointers for tests.
func stringPtr(s string) *string {
	return &s
}
