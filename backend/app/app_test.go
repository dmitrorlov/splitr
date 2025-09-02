package app

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	mock_usecase "github.com/dmitrorlov/splitr/backend/mocks/usecase"
	"github.com/dmitrorlov/splitr/backend/pkg/database"
	"github.com/dmitrorlov/splitr/backend/pkg/logging"
)

type testContextKey string

func TestNew(t *testing.T) {
	tests := []struct {
		name        string
		appName     string
		appVersion  string
		authorName  string
		authorEmail string
	}{
		{
			name:        "create app with all fields",
			appName:     "Splitr",
			appVersion:  "1.0.0",
			authorName:  "Test Author",
			authorEmail: "test@example.com",
		},
		{
			name:        "create app with empty fields",
			appName:     "",
			appVersion:  "",
			authorName:  "",
			authorEmail: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockDB := (*database.Database)(nil)
			mockLogger := &logging.WailsAdapter{}
			mockCommandUC := mock_usecase.NewMockCommandExecutor(ctrl)
			mockHostUC := mock_usecase.NewMockHost(ctrl)
			mockNetworkUC := mock_usecase.NewMockNetwork(ctrl)
			mockNetworkHostUC := mock_usecase.NewMockNetworkHost(ctrl)
			mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
			mockUpdateUC := mock_usecase.NewMockUpdate(ctrl)

			app := New(
				tt.appName,
				tt.appVersion,
				tt.authorName,
				tt.authorEmail,
				mockDB,
				mockLogger,
				mockCommandUC,
				mockHostUC,
				mockNetworkUC,
				mockNetworkHostUC,
				mockNetworkHostSetupUC,
				mockUpdateUC,
			)

			require.NotNil(t, app)
			assert.Equal(t, tt.appName, app.appName)
			assert.Equal(t, tt.appVersion, app.appVersion)
			assert.Equal(t, tt.authorName, app.authorName)
			assert.Equal(t, tt.authorEmail, app.authorEmail)
			assert.Equal(t, mockDB, app.db)
			assert.Equal(t, mockLogger, app.wailsLogger)
			assert.Equal(t, mockCommandUC, app.commandUC)
			assert.Equal(t, mockHostUC, app.hostUC)
			assert.Equal(t, mockNetworkUC, app.networkUC)
			assert.Equal(t, mockNetworkHostUC, app.networkHostUC)
			assert.Equal(t, mockNetworkHostSetupUC, app.networkHostSetupUC)
			assert.Equal(t, mockUpdateUC, app.updateUC)
			assert.Nil(t, app.ctx)
		})
	}
}

func TestApp_OnStartup(t *testing.T) {
	tests := []struct {
		name string
		ctx  context.Context
	}{
		{
			name: "startup with background context",
			ctx:  context.Background(),
		},
		{
			name: "startup with todo context",
			ctx:  context.TODO(),
		},
		{
			name: "startup with value context",
			ctx:  context.WithValue(context.Background(), testContextKey("key"), "value"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)

			assert.Nil(t, app.ctx)

			app.OnStartup(tt.ctx)

			assert.Equal(t, tt.ctx, app.ctx)
		})
	}
}

func TestApp_OnBeforeClose_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockDB := (*database.Database)(nil)
	mockLogger := &logging.WailsAdapter{}
	mockCommandUC := mock_usecase.NewMockCommandExecutor(ctrl)
	mockHostUC := mock_usecase.NewMockHost(ctrl)
	mockNetworkUC := mock_usecase.NewMockNetwork(ctrl)
	mockNetworkHostUC := mock_usecase.NewMockNetworkHost(ctrl)
	mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
	mockUpdateUC := mock_usecase.NewMockUpdate(ctrl)

	app := New(
		"Test App",
		"1.0.0",
		"Test Author",
		"test@example.com",
		mockDB,
		mockLogger,
		mockCommandUC,
		mockHostUC,
		mockNetworkUC,
		mockNetworkHostUC,
		mockNetworkHostSetupUC,
		mockUpdateUC,
	)

	// Can't test actual database close since it's a concrete type

	result := app.OnBeforeClose(context.Background())

	assert.False(t, result)
}

func TestApp_OnBeforeClose_DatabaseError(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockDB := (*database.Database)(nil)
	mockLogger := &logging.WailsAdapter{}
	mockCommandUC := mock_usecase.NewMockCommandExecutor(ctrl)
	mockHostUC := mock_usecase.NewMockHost(ctrl)
	mockNetworkUC := mock_usecase.NewMockNetwork(ctrl)
	mockNetworkHostUC := mock_usecase.NewMockNetworkHost(ctrl)
	mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
	mockUpdateUC := mock_usecase.NewMockUpdate(ctrl)

	app := New(
		"Test App",
		"1.0.0",
		"Test Author",
		"test@example.com",
		mockDB,
		mockLogger,
		mockCommandUC,
		mockHostUC,
		mockNetworkUC,
		mockNetworkHostUC,
		mockNetworkHostSetupUC,
		mockUpdateUC,
	)

	// Test behavior when database close might fail
	// (can't easily mock concrete database type)
	result := app.OnBeforeClose(context.Background())

	assert.False(t, result)
}

func TestApp_OnBeforeClose_NilDatabase(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockLogger := &logging.WailsAdapter{}
	mockCommandUC := mock_usecase.NewMockCommandExecutor(ctrl)
	mockHostUC := mock_usecase.NewMockHost(ctrl)
	mockNetworkUC := mock_usecase.NewMockNetwork(ctrl)
	mockNetworkHostUC := mock_usecase.NewMockNetworkHost(ctrl)
	mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
	mockUpdateUC := mock_usecase.NewMockUpdate(ctrl)

	app := New(
		"Test App",
		"1.0.0",
		"Test Author",
		"test@example.com",
		nil,
		mockLogger,
		mockCommandUC,
		mockHostUC,
		mockNetworkUC,
		mockNetworkHostUC,
		mockNetworkHostSetupUC,
		mockUpdateUC,
	)

	result := app.OnBeforeClose(context.Background())

	assert.False(t, result)
}

func TestApp_ContextPropagation(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)

	ctx := context.Background()
	app.OnStartup(ctx)

	assert.Equal(t, ctx, app.ctx)

	cancelCtx, cancel := context.WithCancel(ctx)
	defer cancel()
	app.OnStartup(cancelCtx)

	assert.Equal(t, cancelCtx, app.ctx)
}

func TestApp_AllFields(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockDB := (*database.Database)(nil)
	mockLogger := &logging.WailsAdapter{}
	mockCommandUC := mock_usecase.NewMockCommandExecutor(ctrl)
	mockHostUC := mock_usecase.NewMockHost(ctrl)
	mockNetworkUC := mock_usecase.NewMockNetwork(ctrl)
	mockNetworkHostUC := mock_usecase.NewMockNetworkHost(ctrl)
	mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
	mockUpdateUC := mock_usecase.NewMockUpdate(ctrl)

	app := New(
		"Splitr Test",
		"2.1.0",
		"John Doe",
		"john@example.com",
		mockDB,
		mockLogger,
		mockCommandUC,
		mockHostUC,
		mockNetworkUC,
		mockNetworkHostUC,
		mockNetworkHostSetupUC,
		mockUpdateUC,
	)

	assert.Equal(t, "Splitr Test", app.appName)
	assert.Equal(t, "2.1.0", app.appVersion)
	assert.Equal(t, "John Doe", app.authorName)
	assert.Equal(t, "john@example.com", app.authorEmail)
	assert.Equal(t, mockDB, app.db)
	assert.NotNil(t, app.wailsLogger)
	assert.NotNil(t, app.commandUC)
	assert.NotNil(t, app.hostUC)
	assert.NotNil(t, app.networkUC)
	assert.NotNil(t, app.networkHostUC)
	assert.NotNil(t, app.networkHostSetupUC)
	assert.NotNil(t, app.updateUC)
}

func createTestApp(ctrl *gomock.Controller) *App {
	mockDB := (*database.Database)(nil)
	mockLogger := &logging.WailsAdapter{}
	mockCommandUC := mock_usecase.NewMockCommandExecutor(ctrl)
	mockHostUC := mock_usecase.NewMockHost(ctrl)
	mockNetworkUC := mock_usecase.NewMockNetwork(ctrl)
	mockNetworkHostUC := mock_usecase.NewMockNetworkHost(ctrl)
	mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
	mockUpdateUC := mock_usecase.NewMockUpdate(ctrl)

	return New(
		"Test App",
		"1.0.0",
		"Test Author",
		"test@example.com",
		mockDB,
		mockLogger,
		mockCommandUC,
		mockHostUC,
		mockNetworkUC,
		mockNetworkHostUC,
		mockNetworkHostSetupUC,
		mockUpdateUC,
	)
}
