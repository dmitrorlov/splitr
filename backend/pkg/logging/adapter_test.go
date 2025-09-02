//go:build darwin

package logging

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	lumberjack "gopkg.in/natefinch/lumberjack.v2"
)

func TestNew_Success(t *testing.T) {
	tests := []struct {
		name   string
		config *Config
	}{
		{
			"Default config",
			&Config{
				LogLevel:      "info",
				LogMaxSizeMB:  25,
				LogMaxBackups: 5,
				LogMaxAgeDays: 30,
				LogCompress:   true,
				LogStderr:     false,
			},
		},
		{
			"Debug config with stderr",
			&Config{
				LogLevel:      "debug",
				LogMaxSizeMB:  50,
				LogMaxBackups: 10,
				LogMaxAgeDays: 60,
				LogCompress:   false,
				LogStderr:     true,
			},
		},
		{
			"Minimal config",
			&Config{
				LogLevel:      "error",
				LogMaxSizeMB:  1,
				LogMaxBackups: 1,
				LogMaxAgeDays: 1,
				LogCompress:   false,
				LogStderr:     false,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			appName := "test-app"
			adapter, err := New(tt.config, appName)

			require.NoError(t, err)
			assert.NotNil(t, adapter)

			// Verify file path is correct
			homeDir, _ := os.UserHomeDir()
			expectedPath := filepath.Join(homeDir, "Library", "Logs", appName, appName+".log")
			assert.Equal(t, expectedPath, adapter.FilePath())

			// Verify log directory was created
			assert.DirExists(t, filepath.Dir(adapter.FilePath()))

			// Clean up
			os.RemoveAll(filepath.Join(homeDir, "Library", "Logs", appName))
		})
	}
}

func TestNew_UserHomeDirError(t *testing.T) {
	// Save original HOME
	originalHome := os.Getenv("HOME")
	defer t.Setenv("HOME", originalHome)

	// Unset HOME to cause UserHomeDir() to fail
	os.Unsetenv("HOME")

	config := &Config{LogLevel: "info"}
	adapter, err := New(config, "test-app")

	require.Error(t, err)
	assert.Nil(t, adapter)
	assert.Contains(t, err.Error(), "failed to get user home directory")
}

func TestNew_MkdirAllError(t *testing.T) {
	// Create a temporary directory and make it read-only
	tempDir := t.TempDir()
	readOnlyDir := filepath.Join(tempDir, "readonly")
	require.NoError(t, os.Mkdir(readOnlyDir, 0555))

	// Try to create the adapter in a subdirectory of the read-only directory
	// This should fail when trying to create the log directory

	// Save and restore HOME
	originalHome := os.Getenv("HOME")
	defer t.Setenv("HOME", originalHome)
	t.Setenv("HOME", readOnlyDir)

	config := &Config{LogLevel: "info"}
	adapter, err := New(config, "test-app")

	require.Error(t, err)
	assert.Nil(t, adapter)
	assert.Contains(t, err.Error(), "failed to ensure log dir")
}

func TestWailsAdapter_FilePath(t *testing.T) {
	tempDir := t.TempDir()

	// Save and restore HOME
	originalHome := os.Getenv("HOME")
	defer t.Setenv("HOME", originalHome)
	t.Setenv("HOME", tempDir)

	config := &Config{LogLevel: "info"}
	appName := "my-test-app"

	adapter, err := New(config, appName)
	require.NoError(t, err)
	defer os.RemoveAll(filepath.Join(tempDir, "Library", "Logs", appName))

	expectedPath := filepath.Join(tempDir, "Library", "Logs", appName, appName+".log")
	assert.Equal(t, expectedPath, adapter.FilePath())
}

func TestWailsAdapter_LoggingMethods(t *testing.T) {
	tempDir := t.TempDir()

	// Save and restore HOME
	originalHome := os.Getenv("HOME")
	defer t.Setenv("HOME", originalHome)
	t.Setenv("HOME", tempDir)

	config := &Config{
		LogLevel:      "debug",
		LogMaxSizeMB:  1,
		LogMaxBackups: 1,
		LogMaxAgeDays: 1,
		LogCompress:   false,
		LogStderr:     false,
	}
	appName := "test-logging-app"

	adapter, err := New(config, appName)
	require.NoError(t, err)
	defer os.RemoveAll(filepath.Join(tempDir, "Library", "Logs", appName))

	tests := []struct {
		name           string
		logFunc        func(string)
		message        string
		expectedPrefix string
	}{
		{"Print method", adapter.Print, "print test message", "[WAILS]"},
		{"Trace method", adapter.Trace, "trace test message", "[WAILS:TRACE]"},
		{"Debug method", adapter.Debug, "debug test message", "[WAILS:DEBUG]"},
		{"Info method", adapter.Info, "info test message", "[WAILS:INFO]"},
		{"Warning method", adapter.Warning, "warning test message", "[WAILS:WARNING]"},
		{"Error method", adapter.Error, "error test message", "[WAILS:ERROR]"},
		{"Fatal method", adapter.Fatal, "fatal test message", "[WAILS:FATAL]"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Call the logging method
			tt.logFunc(tt.message)

			// Force any buffered content to be written
			if lj, ok := adapter.writer.(*lumberjack.Logger); ok {
				lj.Close()
			}

			// Read the log file
			content, readErr := os.ReadFile(adapter.FilePath())
			require.NoError(t, readErr)

			logContent := string(content)
			assert.Contains(t, logContent, tt.expectedPrefix)
			assert.Contains(t, logContent, tt.message)
		})
	}
}

func TestWailsAdapter_LoggingWithStderr(t *testing.T) {
	tempDir := t.TempDir()

	// Save and restore HOME
	originalHome := os.Getenv("HOME")
	defer t.Setenv("HOME", originalHome)
	t.Setenv("HOME", tempDir)

	config := &Config{
		LogLevel:      "debug",
		LogMaxSizeMB:  1,
		LogMaxBackups: 1,
		LogMaxAgeDays: 1,
		LogCompress:   false,
		LogStderr:     true,
	}
	appName := "test-stderr-app"

	adapter, err := New(config, appName)
	require.NoError(t, err)
	defer os.RemoveAll(filepath.Join(tempDir, "Library", "Logs", appName))

	testMessage := "stderr test message"
	adapter.Print(testMessage)

	// Force any buffered content to be written
	if lj, ok := adapter.writer.(*lumberjack.Logger); ok {
		lj.Close()
	}

	// Check file contains the message
	fileContent, err := os.ReadFile(adapter.FilePath())
	require.NoError(t, err)

	assert.Contains(t, string(fileContent), testMessage)
	// Note: We can't reliably test stderr output without reassigning os.Stderr,
	// which triggers linter warnings. The LogStderr functionality is tested
	// by verifying that the adapter was created successfully with LogStderr=true.
}

func TestWailsAdapter_LumberjackConfiguration(t *testing.T) {
	tempDir := t.TempDir()

	// Save and restore HOME
	originalHome := os.Getenv("HOME")
	defer t.Setenv("HOME", originalHome)
	t.Setenv("HOME", tempDir)

	config := &Config{
		LogLevel:      "debug",
		LogMaxSizeMB:  99,
		LogMaxBackups: 17,
		LogMaxAgeDays: 42,
		LogCompress:   true,
		LogStderr:     false,
	}
	appName := "test-lumberjack-app"

	adapter, err := New(config, appName)
	require.NoError(t, err)
	defer os.RemoveAll(filepath.Join(tempDir, "Library", "Logs", appName))

	// For LogStderr=false, the writer should be a *lumberjack.Logger directly
	if lj, ok := adapter.writer.(*lumberjack.Logger); ok {
		assert.Equal(t, int(config.LogMaxSizeMB), lj.MaxSize)
		assert.Equal(t, int(config.LogMaxBackups), lj.MaxBackups)
		assert.Equal(t, int(config.LogMaxAgeDays), lj.MaxAge)
		assert.Equal(t, config.LogCompress, lj.Compress)
		assert.Equal(t, adapter.FilePath(), lj.Filename)
	} else {
		// For LogStderr=true, it would be a MultiWriter, but since LogStderr=false in this test,
		// we expect it to be the lumberjack logger directly
		t.Fatalf("Expected writer to be a *lumberjack.Logger, got %T", adapter.writer)
	}

	// Test with stderr enabled
	config.LogStderr = true
	adapter2, err := New(config, appName+"2")
	require.NoError(t, err)
	defer os.RemoveAll(filepath.Join(tempDir, "Library", "Logs", appName+"2"))

	// For LogStderr=true, the writer is a MultiWriter, so we can't directly access lumberjack
	// But we can verify that the adapter was created successfully
	assert.NotNil(t, adapter2)
	assert.NotNil(t, adapter2.writer)
}

func TestWailsAdapter_EmptyMessages(t *testing.T) {
	tempDir := t.TempDir()

	// Save and restore HOME
	originalHome := os.Getenv("HOME")
	defer t.Setenv("HOME", originalHome)
	t.Setenv("HOME", tempDir)

	config := &Config{LogLevel: "debug"}
	appName := "test-empty-app"

	adapter, err := New(config, appName)
	require.NoError(t, err)
	defer os.RemoveAll(filepath.Join(tempDir, "Library", "Logs", appName))

	// Test empty messages
	adapter.Print("")
	adapter.Info("")
	adapter.Error("")

	// Force any buffered content to be written
	if lj, ok := adapter.writer.(*lumberjack.Logger); ok {
		lj.Close()
	}

	// Read the log file
	content, err := os.ReadFile(adapter.FilePath())
	require.NoError(t, err)

	logContent := string(content)
	assert.Contains(t, logContent, "[WAILS]")
	assert.Contains(t, logContent, "[WAILS:INFO]")
	assert.Contains(t, logContent, "[WAILS:ERROR]")
}

func TestWailsAdapter_ConcurrentLogging(t *testing.T) {
	tempDir := t.TempDir()

	// Save and restore HOME
	originalHome := os.Getenv("HOME")
	defer t.Setenv("HOME", originalHome)
	t.Setenv("HOME", tempDir)

	config := &Config{LogLevel: "debug"}
	appName := "test-concurrent-app"

	adapter, err := New(config, appName)
	require.NoError(t, err)
	defer os.RemoveAll(filepath.Join(tempDir, "Library", "Logs", appName))

	// Launch multiple goroutines that log concurrently
	done := make(chan bool, 10)
	for i := range 10 {
		go func(id int) {
			defer func() { done <- true }()
			message := fmt.Sprintf("concurrent message %d", id)
			adapter.Info(message)
			adapter.Error(message)
			adapter.Debug(message)
		}(i)
	}

	// Wait for all goroutines to complete
	for range 10 {
		<-done
	}

	// Force any buffered content to be written
	if lj, ok := adapter.writer.(*lumberjack.Logger); ok {
		lj.Close()
	}

	// Read the log file and verify all messages are present
	content, err := os.ReadFile(adapter.FilePath())
	require.NoError(t, err)

	logContent := string(content)
	for i := range 10 {
		expectedMessage := fmt.Sprintf("concurrent message %d", i)
		assert.Contains(t, logContent, expectedMessage)
	}
}

func TestWailsAdapter_LargeMessages(t *testing.T) {
	tempDir := t.TempDir()

	// Save and restore HOME
	originalHome := os.Getenv("HOME")
	defer t.Setenv("HOME", originalHome)
	t.Setenv("HOME", tempDir)

	config := &Config{LogLevel: "debug"}
	appName := "test-large-app"

	adapter, err := New(config, appName)
	require.NoError(t, err)
	defer os.RemoveAll(filepath.Join(tempDir, "Library", "Logs", appName))

	// Create a large message
	largeMessage := strings.Repeat("A", 1000)
	adapter.Info(largeMessage)

	// Force any buffered content to be written
	if lj, ok := adapter.writer.(*lumberjack.Logger); ok {
		lj.Close()
	}

	// Read the log file
	content, err := os.ReadFile(adapter.FilePath())
	require.NoError(t, err)

	logContent := string(content)
	assert.Contains(t, logContent, largeMessage)
}

func TestBuildConstraint(t *testing.T) {
	// Read the adapter.go file and verify it has the build constraint
	content, err := os.ReadFile("adapter.go")
	require.NoError(t, err)

	fileContent := string(content)
	lines := strings.Split(fileContent, "\n")

	// Check that the first line contains the build constraint
	assert.NotEmpty(t, lines)
	assert.Contains(t, lines[0], "//go:build darwin")
}
