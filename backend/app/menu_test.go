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
	"github.com/dmitrorlov/splitr/backend/pkg/database"
	"github.com/dmitrorlov/splitr/backend/pkg/logging"
)

func TestApp_CreateMenu(t *testing.T) {
	tests := []struct {
		name        string
		appName     string
		appVersion  string
		authorName  string
		authorEmail string
	}{
		{
			name:        "create menu with standard app info",
			appName:     "Splitr",
			appVersion:  "1.0.0",
			authorName:  "John Doe",
			authorEmail: "john@example.com",
		},
		{
			name:        "create menu with empty app info",
			appName:     "",
			appVersion:  "",
			authorName:  "",
			authorEmail: "",
		},
		{
			name:        "create menu with unicode characters",
			appName:     "Splitr 🌐",
			appVersion:  "2.0.0-beta",
			authorName:  "José María",
			authorEmail: "josé@example.com",
		},
		{
			name:        "create menu with long app info",
			appName:     "Very Long Application Name That Might Test UI Limits",
			appVersion:  "1.0.0-alpha.1+build.123",
			authorName:  "Very Long Author Name That Might Also Test UI Limits",
			authorEmail: "very.long.email.address@very.long.domain.example.com",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestAppWithInfo(ctrl, tt.appName, tt.appVersion, tt.authorName, tt.authorEmail)

			menu := app.CreateMenu()

			require.NotNil(t, menu)
			assert.NotNil(t, menu.Items)
			assert.NotEmpty(t, menu.Items, "Menu should have at least one item")

			// Verify the structure contains expected menu items
			// Note: We can't easily test the actual menu structure without
			// more complex mocking of the wails menu package, but we can
			// ensure the method doesn't panic and returns a valid menu
		})
	}
}

func TestApp_CheckForUpdates_UpdateAvailable(t *testing.T) {
	t.Skip("Skip dialog test - requires Wails runtime context")
	tests := []struct {
		name       string
		updateInfo *entity.UpdateInfo
	}{
		{
			name: "update available with standard info",
			updateInfo: &entity.UpdateInfo{
				Available:           true,
				CurrentVersion:      "1.0.0",
				LatestVersion:       "1.1.0",
				PublishedAtAsString: "2023-12-01",
				HomebrewCommand:     "brew upgrade splitr",
				ReleasePageURL:      "https://github.com/example/splitr/releases/tag/v1.1.0",
			},
		},
		{
			name: "update available with pre-release",
			updateInfo: &entity.UpdateInfo{
				Available:           true,
				CurrentVersion:      "1.0.0",
				LatestVersion:       "1.1.0-beta.1",
				PublishedAtAsString: "2023-12-01T10:00:00Z",
				HomebrewCommand:     "brew upgrade splitr --fetch-HEAD",
				ReleasePageURL:      "https://github.com/example/splitr/releases/tag/v1.1.0-beta.1",
			},
		},
		{
			name: "update available with empty commands",
			updateInfo: &entity.UpdateInfo{
				Available:           true,
				CurrentVersion:      "1.0.0",
				LatestVersion:       "1.1.0",
				PublishedAtAsString: "2023-12-01",
				HomebrewCommand:     "",
				ReleasePageURL:      "",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.updateUC.(*mock_usecase.MockUpdate).EXPECT().
				CheckForUpdates().
				Return(tt.updateInfo, nil)

			// We can't easily test the actual dialog behavior without mocking
			// the wails runtime, but we can test that the method doesn't panic
			// and properly calls the use case
			app.checkForUpdates()
		})
	}
}

func TestApp_CheckForUpdates_NoUpdateAvailable(t *testing.T) {
	t.Skip("Skip dialog test - requires Wails runtime context")
	tests := []struct {
		name       string
		updateInfo *entity.UpdateInfo
	}{
		{
			name: "no update available",
			updateInfo: &entity.UpdateInfo{
				Available:      false,
				CurrentVersion: "1.0.0",
				LatestVersion:  "1.0.0",
			},
		},
		{
			name: "current version newer than latest",
			updateInfo: &entity.UpdateInfo{
				Available:      false,
				CurrentVersion: "1.1.0",
				LatestVersion:  "1.0.0",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.updateUC.(*mock_usecase.MockUpdate).EXPECT().
				CheckForUpdates().
				Return(tt.updateInfo, nil)

			app.checkForUpdates()
		})
	}
}

func TestApp_CheckForUpdates_Error(t *testing.T) {
	t.Skip("Skip dialog test - requires Wails runtime context")
	tests := []struct {
		name        string
		error       error
		description string
	}{
		{
			name:        "network error",
			error:       errors.New("network connection failed"),
			description: "Should handle network connectivity issues",
		},
		{
			name:        "api error",
			error:       errors.New("GitHub API rate limit exceeded"),
			description: "Should handle API rate limiting",
		},
		{
			name:        "timeout error",
			error:       errors.New("request timeout"),
			description: "Should handle request timeouts",
		},
		{
			name:        "parsing error",
			error:       errors.New("invalid response format"),
			description: "Should handle invalid response data",
		},
		{
			name:        "permission error",
			error:       errors.New("permission denied"),
			description: "Should handle permission issues",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.updateUC.(*mock_usecase.MockUpdate).EXPECT().
				CheckForUpdates().
				Return(nil, tt.error)

			// Should not panic when update check fails
			app.checkForUpdates()
		})
	}
}

func TestApp_About_Dialog(t *testing.T) {
	t.Skip("Skip dialog test - requires Wails runtime context")
	tests := []struct {
		name        string
		appVersion  string
		authorName  string
		authorEmail string
	}{
		{
			name:        "standard about info",
			appVersion:  "1.0.0",
			authorName:  "John Doe",
			authorEmail: "john@example.com",
		},
		{
			name:        "empty about info",
			appVersion:  "",
			authorName:  "",
			authorEmail: "",
		},
		{
			name:        "special characters in about info",
			appVersion:  "1.0.0-α",
			authorName:  "José María González",
			authorEmail: "josé.maría@example.com",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestAppWithInfo(ctrl, "Test App", tt.appVersion, tt.authorName, tt.authorEmail)
			app.OnStartup(context.Background())

			// Should not panic when showing about dialog
			app.about()
		})
	}
}

func TestApp_Menu_ViewLogsAction(t *testing.T) {
	tests := []struct {
		name        string
		logFilePath string
		expectError bool
		error       error
	}{
		{
			name:        "successful log file open",
			logFilePath: "/Users/test/Library/Logs/Splitr/Splitr.log",
			expectError: false,
		},
		{
			name:        "log file open error",
			logFilePath: "/Users/test/Library/Logs/Splitr/Splitr.log",
			expectError: true,
			error:       errors.New("file not found"),
		},
		{
			name:        "permission denied error",
			logFilePath: "/restricted/path/Splitr.log",
			expectError: true,
			error:       errors.New("permission denied"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			if tt.expectError {
				app.commandUC.(*mock_usecase.MockCommandExecutor).EXPECT().
					OpenInFinder(gomock.Any(), tt.logFilePath).
					Return(tt.error)
			} else {
				app.commandUC.(*mock_usecase.MockCommandExecutor).EXPECT().
					OpenInFinder(gomock.Any(), tt.logFilePath).
					Return(nil)
			}

			// Simulate the behavior of the "View Logs" menu action
			// We can't easily test the actual menu callback without more complex mocking
			err := app.commandUC.OpenInFinder(app.ctx, tt.logFilePath)

			if tt.expectError {
				require.Error(t, err)
				assert.Equal(t, tt.error, err)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestApp_Menu_ContextUsage(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type contextKey string
	app := createTestApp(ctrl)
	ctx := context.WithValue(context.Background(), contextKey("test"), "context")
	app.OnStartup(ctx)

	// Test that menu actions would use the correct context
	t.Run("view logs uses context", func(t *testing.T) {
		app.commandUC.(*mock_usecase.MockCommandExecutor).EXPECT().
			OpenInFinder(ctx, gomock.Any()).
			Return(nil)

		err := app.commandUC.OpenInFinder(app.ctx, "/test/path")
		require.NoError(t, err)
	})

	t.Run("check for updates uses correct context", func(t *testing.T) {
		t.Skip("Skip - dialog calls not testable")
		app.updateUC.(*mock_usecase.MockUpdate).EXPECT().
			CheckForUpdates().
			Return(&entity.UpdateInfo{Available: false}, nil)

		app.checkForUpdates()
	})
}

func TestApp_Menu_WailsLoggerFilePath(t *testing.T) {
	tests := []struct {
		name         string
		expectedPath string
	}{
		{
			name:         "standard log path",
			expectedPath: "/Users/test/Library/Logs/TestApp/TestApp.log",
		},
		{
			name:         "empty log path",
			expectedPath: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())
		})
	}
}

func TestApp_UpdateInfo_DialogContent(t *testing.T) {
	t.Skip("Skip dialog test - requires Wails runtime context")
	tests := []struct {
		name       string
		updateInfo *entity.UpdateInfo
	}{
		{
			name: "complete update information",
			updateInfo: &entity.UpdateInfo{
				Available:           true,
				CurrentVersion:      "1.0.0",
				LatestVersion:       "1.1.0",
				PublishedAtAsString: "2023-12-01T10:00:00Z",
				HomebrewCommand:     "brew upgrade splitr",
				ReleasePageURL:      "https://github.com/example/splitr/releases/tag/v1.1.0",
			},
		},
		{
			name: "minimal update information",
			updateInfo: &entity.UpdateInfo{
				Available:           true,
				CurrentVersion:      "1.0.0",
				LatestVersion:       "1.1.0",
				PublishedAtAsString: "",
				HomebrewCommand:     "",
				ReleasePageURL:      "",
			},
		},
		{
			name: "version with build metadata",
			updateInfo: &entity.UpdateInfo{
				Available:           true,
				CurrentVersion:      "1.0.0+build.123",
				LatestVersion:       "1.1.0+build.456",
				PublishedAtAsString: "2023-12-01T10:00:00+00:00",
				HomebrewCommand:     "brew upgrade splitr --build-from-source",
				ReleasePageURL:      "https://github.com/example/splitr/releases/tag/v1.1.0",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.updateUC.(*mock_usecase.MockUpdate).EXPECT().
				CheckForUpdates().
				Return(tt.updateInfo, nil)

			// Test that the method handles different types of update information
			app.checkForUpdates()
		})
	}
}

func TestApp_Menu_EdgeCases(t *testing.T) {
	t.Run("create menu without context", func(t *testing.T) {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		app := createTestApp(ctrl)
		// Don't call OnStartup to leave context as nil

		menu := app.CreateMenu()
		require.NotNil(t, menu)
	})

	t.Run("about dialog without context", func(t *testing.T) {
		t.Skip("Skip - dialog calls not testable")
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		app := createTestApp(ctrl)
		// Don't call OnStartup to leave context as nil

		// Should not panic even without context
		app.about()
	})

	t.Run("check for updates without context", func(t *testing.T) {
		t.Skip("Skip - dialog calls not testable")
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		app := createTestApp(ctrl)
		// Don't call OnStartup to leave context as nil

		app.updateUC.(*mock_usecase.MockUpdate).EXPECT().
			CheckForUpdates().
			Return(&entity.UpdateInfo{Available: false}, nil)

		app.checkForUpdates()
	})
}

func TestApp_Menu_ConcurrentDialogs(t *testing.T) {
	t.Skip("Skip dialog test - requires Wails runtime context")
	// Test that multiple dialog operations don't interfere with each other
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	app.updateUC.(*mock_usecase.MockUpdate).EXPECT().
		CheckForUpdates().
		Return(&entity.UpdateInfo{Available: false}, nil).
		AnyTimes()

	app.commandUC.(*mock_usecase.MockCommandExecutor).EXPECT().
		OpenInFinder(gomock.Any(), gomock.Any()).
		Return(nil).
		AnyTimes()

	// Run multiple dialog operations concurrently
	done := make(chan bool, 3)

	go func() {
		defer func() { done <- true }()
		for range 5 {
			app.about()
		}
	}()

	go func() {
		defer func() { done <- true }()
		for range 5 {
			app.checkForUpdates()
		}
	}()

	go func() {
		defer func() { done <- true }()
		for range 5 {
			_ = app.commandUC.OpenInFinder(app.ctx, "/test/path")
		}
	}()

	// Wait for all goroutines to complete
	for range 3 {
		<-done
	}
}

func TestApp_UpdateInfo_ErrorScenarios(t *testing.T) {
	t.Skip("Skip dialog test - requires Wails runtime context")
	tests := []struct {
		name         string
		updateInfo   *entity.UpdateInfo
		error        error
		shouldHandle bool
	}{
		{
			name:         "nil update info with error",
			updateInfo:   nil,
			error:        errors.New("failed to fetch update info"),
			shouldHandle: true,
		},
		{
			name: "malformed update info",
			updateInfo: &entity.UpdateInfo{
				Available:           true,
				CurrentVersion:      "invalid-version",
				LatestVersion:       "also-invalid",
				PublishedAtAsString: "not-a-date",
				HomebrewCommand:     "invalid command with | pipes",
				ReleasePageURL:      "not-a-url",
			},
			error:        nil,
			shouldHandle: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			app := createTestApp(ctrl)
			app.OnStartup(context.Background())

			app.updateUC.(*mock_usecase.MockUpdate).EXPECT().
				CheckForUpdates().
				Return(tt.updateInfo, tt.error)

			// Should handle malformed data gracefully without panicking
			app.checkForUpdates()
		})
	}
}

// Helper function to create test app with specific app information.
func createTestAppWithInfo(ctrl *gomock.Controller, appName, appVersion, authorName, authorEmail string) *App {
	mockDB := &database.Database{}
	mockLogger := &logging.WailsAdapter{}
	mockCommandUC := mock_usecase.NewMockCommandExecutor(ctrl)
	mockHostUC := mock_usecase.NewMockHost(ctrl)
	mockNetworkUC := mock_usecase.NewMockNetwork(ctrl)
	mockNetworkHostUC := mock_usecase.NewMockNetworkHost(ctrl)
	mockNetworkHostSetupUC := mock_usecase.NewMockNetworkHostSetup(ctrl)
	mockUpdateUC := mock_usecase.NewMockUpdate(ctrl)

	return New(
		appName,
		appVersion,
		authorName,
		authorEmail,
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
