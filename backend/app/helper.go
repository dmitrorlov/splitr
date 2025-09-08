package app

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const jsonExtension = ".json"

func (a *App) SaveFileWithDialog(filename, data string) (string, error) {
	// Sanitize the filename to remove any invalid characters
	safeFilename := strings.ReplaceAll(filename, "/", "_")
	safeFilename = strings.ReplaceAll(safeFilename, "\\", "_")
	safeFilename = strings.ReplaceAll(safeFilename, ":", "_")
	safeFilename = strings.ReplaceAll(safeFilename, "*", "_")
	safeFilename = strings.ReplaceAll(safeFilename, "?", "_")
	safeFilename = strings.ReplaceAll(safeFilename, "\"", "_")
	safeFilename = strings.ReplaceAll(safeFilename, "<", "_")
	safeFilename = strings.ReplaceAll(safeFilename, ">", "_")
	safeFilename = strings.ReplaceAll(safeFilename, "|", "_")

	// Ensure the filename has a .json extension
	if !strings.HasSuffix(strings.ToLower(safeFilename), jsonExtension) {
		safeFilename += jsonExtension
	}

	// Show save file dialog
	filePath, err := wailsRuntime.SaveFileDialog(a.ctx, wailsRuntime.SaveDialogOptions{
		Title:           "Save Export File",
		DefaultFilename: safeFilename,
		Filters: []wailsRuntime.FileFilter{
			{
				DisplayName: "JSON Files (*.json)",
				Pattern:     "*.json",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	})
	if err != nil {
		return "", fmt.Errorf("failed to show save dialog: %w", err)
	}

	// If user cancelled the dialog, filePath will be empty
	if filePath == "" {
		return "", nil
	}

	// Write the data to the selected file
	err = os.WriteFile(filePath, []byte(data), 0600)
	if err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	// Return the absolute path of the saved file
	absPath, err := filepath.Abs(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to get absolute path: %w", err)
	}

	return absPath, nil
}
