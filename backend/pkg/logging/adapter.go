//go:build darwin

package logging

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"

	lumberjack "gopkg.in/natefinch/lumberjack.v2"
)

type WailsAdapter struct {
	filePath string
	writer   io.Writer
}

func New(cfg *Config, appName string) (*WailsAdapter, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get user home directory: %w", err)
	}

	filePath := filepath.Join(homeDir, "Library", "Logs", appName, appName+".log")
	err = os.MkdirAll(filepath.Dir(filePath), 0o750)
	if err != nil {
		return nil, fmt.Errorf("failed to ensure log dir: %w", err)
	}

	// Rolling file writer
	lj := &lumberjack.Logger{
		Filename:   filePath,
		MaxSize:    int(cfg.LogMaxSizeMB),
		MaxBackups: int(cfg.LogMaxBackups),
		MaxAge:     int(cfg.LogMaxAgeDays),
		Compress:   cfg.LogCompress,
	}

	w := io.Writer(lj)
	if cfg.LogStderr {
		w = io.MultiWriter(lj, os.Stderr)
	}

	// Configure slog with a text handler for readability in files.
	slog.SetDefault(slog.New(slog.NewTextHandler(w, &slog.HandlerOptions{Level: cfg.GetSLogLevel()})))

	return &WailsAdapter{
		filePath: filePath,
		writer:   w,
	}, nil
}

func (a *WailsAdapter) FilePath() string {
	return a.filePath
}

func (a *WailsAdapter) Print(message string) {
	_, _ = a.writer.Write([]byte("[WAILS] " + message + "\n"))
}

func (a *WailsAdapter) Trace(message string) {
	_, _ = a.writer.Write([]byte("[WAILS:TRACE] " + message + "\n"))
}

func (a *WailsAdapter) Debug(message string) {
	_, _ = a.writer.Write([]byte("[WAILS:DEBUG] " + message + "\n"))
}

func (a *WailsAdapter) Info(message string) {
	_, _ = a.writer.Write([]byte("[WAILS:INFO] " + message + "\n"))
}

func (a *WailsAdapter) Warning(message string) {
	_, _ = a.writer.Write([]byte("[WAILS:WARNING] " + message + "\n"))
}

func (a *WailsAdapter) Error(message string) {
	_, _ = a.writer.Write([]byte("[WAILS:ERROR] " + message + "\n"))
}

func (a *WailsAdapter) Fatal(message string) {
	_, _ = a.writer.Write([]byte("[WAILS:FATAL] " + message + "\n"))
}
