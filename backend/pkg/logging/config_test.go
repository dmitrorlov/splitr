package logging

import (
	"log/slog"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfig_GetSLogLevel(t *testing.T) {
	tests := []struct {
		name     string
		logLevel string
		expected slog.Level
	}{
		{"Debug level", "debug", slog.LevelDebug},
		{"Debug level uppercase", "DEBUG", slog.LevelDebug},
		{"Debug level mixed case", "Debug", slog.LevelDebug},
		{"Debug level with spaces", " debug ", slog.LevelDebug},
		{"Info level", "info", slog.LevelInfo},
		{"Info level uppercase", "INFO", slog.LevelInfo},
		{"Warn level", "warn", slog.LevelWarn},
		{"Warning level", "warning", slog.LevelWarn},
		{"Warning level uppercase", "WARNING", slog.LevelWarn},
		{"Error level", "error", slog.LevelError},
		{"Err level", "err", slog.LevelError},
		{"Error level uppercase", "ERROR", slog.LevelError},
		{"Empty string defaults to info", "", envDefaultLogLevel},
		{"Invalid level defaults to info", "invalid", envDefaultLogLevel},
		{"Unknown level defaults to info", "trace", envDefaultLogLevel},
		{"Numeric string defaults to info", "123", envDefaultLogLevel},
		{"Special characters default to info", "!@#", envDefaultLogLevel},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			config := &Config{LogLevel: tt.logLevel}
			result := config.GetSLogLevel()
			assert.Equal(t, tt.expected, result)
		})
	}
}
