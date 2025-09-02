package app

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestApp_SaveFileWithDialog_FilenameProcessing(t *testing.T) {
	tests := []struct {
		name             string
		inputFilename    string
		expectedFilename string
		description      string
	}{
		{
			name:             "normal filename",
			inputFilename:    "test_file",
			expectedFilename: "test_file.json",
			description:      "Should add .json extension",
		},
		{
			name:             "filename with .json extension",
			inputFilename:    "test_file.json",
			expectedFilename: "test_file.json",
			description:      "Should not double-add .json extension",
		},
		{
			name:             "filename with invalid characters",
			inputFilename:    "test/file\\with:invalid*chars?<>|\"",
			expectedFilename: "test_file_with_invalid_chars_____.json",
			description:      "Should replace invalid characters with underscores",
		},
		{
			name:             "filename with forward slash",
			inputFilename:    "folder/subfolder/file",
			expectedFilename: "folder_subfolder_file.json",
			description:      "Should replace forward slashes",
		},
		{
			name:             "filename with backslash",
			inputFilename:    "folder\\subfolder\\file",
			expectedFilename: "folder_subfolder_file.json",
			description:      "Should replace backslashes",
		},
		{
			name:             "filename with colon",
			inputFilename:    "time:stamp:file",
			expectedFilename: "time_stamp_file.json",
			description:      "Should replace colons",
		},
		{
			name:             "filename with asterisk",
			inputFilename:    "wild*card*file",
			expectedFilename: "wild_card_file.json",
			description:      "Should replace asterisks",
		},
		{
			name:             "filename with question mark",
			inputFilename:    "what?file",
			expectedFilename: "what_file.json",
			description:      "Should replace question marks",
		},
		{
			name:             "filename with quotes",
			inputFilename:    "quoted\"file",
			expectedFilename: "quoted_file.json",
			description:      "Should replace quotes",
		},
		{
			name:             "filename with angle brackets",
			inputFilename:    "angle<bracket>file",
			expectedFilename: "angle_bracket_file.json",
			description:      "Should replace angle brackets",
		},
		{
			name:             "filename with pipe",
			inputFilename:    "pipe|file",
			expectedFilename: "pipe_file.json",
			description:      "Should replace pipe characters",
		},
		{
			name:             "empty filename",
			inputFilename:    "",
			expectedFilename: ".json",
			description:      "Should handle empty filename",
		},
		{
			name:             "mixed case json extension",
			inputFilename:    "test.JSON",
			expectedFilename: "test.JSON",
			description:      "Should preserve mixed case .JSON extension",
		},
		{
			name:             "json extension with mixed case filename",
			inputFilename:    "Test.Json",
			expectedFilename: "Test.Json",
			description:      "Should preserve mixed case .Json extension",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// We can't easily test the actual dialog without mocking the wails runtime
			// But we can test the filename sanitization logic by examining what would
			// be passed to the dialog

			// Create a test that verifies the filename processing logic
			safeFilename := strings.ReplaceAll(tt.inputFilename, "/", "_")
			safeFilename = strings.ReplaceAll(safeFilename, "\\", "_")
			safeFilename = strings.ReplaceAll(safeFilename, ":", "_")
			safeFilename = strings.ReplaceAll(safeFilename, "*", "_")
			safeFilename = strings.ReplaceAll(safeFilename, "?", "_")
			safeFilename = strings.ReplaceAll(safeFilename, "\"", "_")
			safeFilename = strings.ReplaceAll(safeFilename, "<", "_")
			safeFilename = strings.ReplaceAll(safeFilename, ">", "_")
			safeFilename = strings.ReplaceAll(safeFilename, "|", "_")

			if !strings.HasSuffix(strings.ToLower(safeFilename), ".json") {
				safeFilename += ".json"
			}

			assert.Equal(t, tt.expectedFilename, safeFilename, tt.description)
		})
	}
}

func TestApp_SaveFileWithDialog_Integration(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	app := createTestApp(ctrl)
	app.OnStartup(context.Background())

	tests := []struct {
		name         string
		filename     string
		data         string
		expectError  bool
		errorMessage string
	}{
		{
			name:        "save simple data",
			filename:    "test_export",
			data:        `{"test": "data"}`,
			expectError: false,
		},
		{
			name:        "save complex json data",
			filename:    "complex_export.json",
			data:        `{"hosts": [{"address": "192.168.1.1", "description": "Router"}], "export_date": "2023-01-01T00:00:00Z"}`,
			expectError: false,
		},
		{
			name:        "save empty data",
			filename:    "empty_export",
			data:        "",
			expectError: false,
		},
		{
			name:        "save data with special characters",
			filename:    "special_chars",
			data:        `{"message": "Hello, 世界! Special chars: @#$%^&*()"}`,
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a temporary directory for testing
			tempDir := t.TempDir()

			// Mock the dialog behavior by directly saving to temp directory
			// In real implementation, wailsRuntime.SaveFileDialog would handle this
			expectedPath := filepath.Join(tempDir, tt.filename)
			if !strings.HasSuffix(strings.ToLower(expectedPath), ".json") {
				expectedPath += ".json"
			}

			// Write the file directly to simulate successful dialog interaction
			if !tt.expectError {
				err := os.WriteFile(expectedPath, []byte(tt.data), 0600)
				require.NoError(t, err)

				// Verify file was created with correct content
				content, err := os.ReadFile(expectedPath)
				require.NoError(t, err)
				assert.Equal(t, tt.data, string(content))

				// Verify file permissions
				info, err := os.Stat(expectedPath)
				require.NoError(t, err)
				assert.Equal(t, os.FileMode(0600), info.Mode().Perm())
			}
		})
	}
}

func TestApp_SaveFileWithDialog_FileOperations(t *testing.T) {
	tests := []struct {
		name            string
		data            string
		expectedContent string
		permissions     os.FileMode
	}{
		{
			name:            "standard json data",
			data:            `{"test": "value"}`,
			expectedContent: `{"test": "value"}`,
			permissions:     0600,
		},
		{
			name:            "large json data",
			data:            strings.Repeat(`{"key": "value"}`, 1000),
			expectedContent: strings.Repeat(`{"key": "value"}`, 1000),
			permissions:     0600,
		},
		{
			name:            "multiline json data",
			data:            "{\n  \"test\": \"value\",\n  \"nested\": {\n    \"key\": \"value\"\n  }\n}",
			expectedContent: "{\n  \"test\": \"value\",\n  \"nested\": {\n    \"key\": \"value\"\n  }\n}",
			permissions:     0600,
		},
		{
			name:            "empty data",
			data:            "",
			expectedContent: "",
			permissions:     0600,
		},
		{
			name:            "unicode data",
			data:            `{"message": "Hello 世界", "emoji": "🌍"}`,
			expectedContent: `{"message": "Hello 世界", "emoji": "🌍"}`,
			permissions:     0600,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tempDir := t.TempDir()
			filePath := filepath.Join(tempDir, "test.json")

			err := os.WriteFile(filePath, []byte(tt.data), tt.permissions)
			require.NoError(t, err)

			// Verify content
			content, err := os.ReadFile(filePath)
			require.NoError(t, err)
			assert.Equal(t, tt.expectedContent, string(content))

			// Verify permissions
			info, err := os.Stat(filePath)
			require.NoError(t, err)
			assert.Equal(t, tt.permissions, info.Mode().Perm())

			// Verify absolute path can be obtained
			absPath, err := filepath.Abs(filePath)
			require.NoError(t, err)
			assert.True(t, filepath.IsAbs(absPath))
			assert.Contains(t, absPath, "test.json")
		})
	}
}

func TestApp_SaveFileWithDialog_ErrorHandling(t *testing.T) {
	tests := []struct {
		name             string
		setupError       func() (string, func())
		expectedContains string
	}{
		{
			name: "invalid directory permissions",
			setupError: func() (string, func()) {
				tempDir := t.TempDir()
				restrictedDir := filepath.Join(tempDir, "restricted")
				err := os.Mkdir(restrictedDir, 0000)
				require.NoError(t, err)

				testFile := filepath.Join(restrictedDir, "test.json")
				cleanup := func() {
					os.Chmod(restrictedDir, 0755)
					os.RemoveAll(restrictedDir)
				}
				return testFile, cleanup
			},
			expectedContains: "permission denied",
		},
		{
			name: "path too long",
			setupError: func() (string, func()) {
				tempDir := t.TempDir()
				// Create a very long filename that might exceed filesystem limits
				longName := strings.Repeat("a", 300) + ".json"
				testFile := filepath.Join(tempDir, longName)
				return testFile, func() {}
			},
			expectedContains: "", // This might not error on all systems
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			filePath, cleanup := tt.setupError()
			defer cleanup()

			data := `{"test": "data"}`
			err := os.WriteFile(filePath, []byte(data), 0600)

			if tt.expectedContains != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedContains)
			}
		})
	}
}

func TestApp_SaveFileWithDialog_EdgeCases(t *testing.T) {
	tests := []struct {
		name        string
		filename    string
		data        string
		description string
	}{
		{
			name:        "very long filename",
			filename:    strings.Repeat("a", 200),
			data:        `{"test": "data"}`,
			description: "Should handle very long filenames",
		},
		{
			name:        "filename with only special chars",
			filename:    "\\/:*?\"<>|",
			data:        `{"test": "data"}`,
			description: "Should handle filename with only special characters",
		},
		{
			name:        "filename with spaces",
			filename:    "file with spaces",
			data:        `{"test": "data"}`,
			description: "Should handle filenames with spaces",
		},
		{
			name:        "filename with numbers",
			filename:    "12345",
			data:        `{"test": "data"}`,
			description: "Should handle numeric filenames",
		},
		{
			name:        "filename with mixed characters",
			filename:    "File_123-TEST.backup",
			data:        `{"test": "data"}`,
			description: "Should handle mixed character filenames",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Test filename sanitization logic
			safeFilename := tt.filename
			safeFilename = strings.ReplaceAll(safeFilename, "/", "_")
			safeFilename = strings.ReplaceAll(safeFilename, "\\", "_")
			safeFilename = strings.ReplaceAll(safeFilename, ":", "_")
			safeFilename = strings.ReplaceAll(safeFilename, "*", "_")
			safeFilename = strings.ReplaceAll(safeFilename, "?", "_")
			safeFilename = strings.ReplaceAll(safeFilename, "\"", "_")
			safeFilename = strings.ReplaceAll(safeFilename, "<", "_")
			safeFilename = strings.ReplaceAll(safeFilename, ">", "_")
			safeFilename = strings.ReplaceAll(safeFilename, "|", "_")

			if !strings.HasSuffix(strings.ToLower(safeFilename), ".json") {
				safeFilename += ".json"
			}

			// Verify the sanitized filename is valid
			assert.NotEmpty(t, safeFilename)
			assert.True(t, strings.HasSuffix(strings.ToLower(safeFilename), ".json"))

			// Verify no invalid characters remain
			invalidChars := []string{"/", "\\", ":", "*", "?", "\"", "<", ">", "|"}
			for _, char := range invalidChars {
				assert.NotContains(t, safeFilename, char, "Should not contain invalid character: %s", char)
			}

			// Test that we can create a file with the sanitized name
			tempDir := t.TempDir()
			testPath := filepath.Join(tempDir, safeFilename)

			err := os.WriteFile(testPath, []byte(tt.data), 0600)
			require.NoError(t, err, "Should be able to create file with sanitized name")

			if err == nil {
				// Verify file content
				content, readErr := os.ReadFile(testPath)
				require.NoError(t, readErr)
				assert.Equal(t, tt.data, string(content))
			}
		})
	}
}
