package logging

import (
	"log/slog"
	"strings"
)

const (
	envDefaultLogLevel = slog.LevelInfo
)

type Config struct {
	LogLevel      string `env:"SPLITR_LOG_LEVEL"        env-default:"info"`
	LogMaxSizeMB  uint8  `env:"SPLITR_LOG_MAX_SIZE_MB"  env-default:"25"`
	LogMaxBackups uint8  `env:"SPLITR_LOG_MAX_BACKUPS"  env-default:"5"`
	LogMaxAgeDays uint8  `env:"SPLITR_LOG_MAX_AGE_DAYS" env-default:"30"`
	LogCompress   bool   `env:"SPLITR_LOG_COMPRESS"     env-default:"true"`
	LogStderr     bool   `env:"SPLITR_LOG_STDERR"       env-default:"false"`
}

func (c *Config) GetSLogLevel() slog.Level {
	val := strings.ToLower(strings.TrimSpace(c.LogLevel))
	switch val {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn", "warning":
		return slog.LevelWarn
	case "error", "err":
		return slog.LevelError
	default:
		return envDefaultLogLevel
	}
}
