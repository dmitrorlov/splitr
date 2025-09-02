package command

import (
	"context"
	"fmt"
	"log/slog"
	"os/exec"
	"strings"
)

type defaultCommandRunner struct{}

func (r *defaultCommandRunner) Run(ctx context.Context, name string, args ...string) ([]string, error) {
	slog.InfoContext(ctx, fmt.Sprintf("executing command: %s %s", name, strings.Join(args, " ")))

	cmd := exec.CommandContext(ctx, name, args...)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to execute command: %w", err)
	}

	return strings.Split(string(output), "\n"), nil
}
