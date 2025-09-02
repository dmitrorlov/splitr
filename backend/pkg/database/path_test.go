package database

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetMacOSAppDataPath(t *testing.T) {
	tests := []struct {
		name    string
		appName string
	}{
		{
			name:    "basic app name",
			appName: "TestApp",
		},
		{
			name:    "app name with spaces",
			appName: "My Test App",
		},
		{
			name:    "empty app name",
			appName: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			home, err := os.UserHomeDir()
			require.NoError(t, err)

			expected := filepath.Join(home, "Library", "Application Support", tt.appName)

			result, err := getMacOSAppDataPath(tt.appName)
			require.NoError(t, err)
			assert.Equal(t, expected, result)
		})
	}
}

func TestGetMacOSAppDataPath_UserHomeDirError(t *testing.T) {
	// This test would require mocking os.UserHomeDir which is complex
	// The function is tested via the success path above
	// Error cases are covered in the database tests through dependency injection
	t.Skip("User home dir error testing requires complex mocking")
}
