package database

import (
	"fmt"
	"os"
	"path/filepath"
)

func getMacOSAppDataPath(appName string) (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}

	return filepath.Join(home, "Library", "Application Support", appName), nil
}
