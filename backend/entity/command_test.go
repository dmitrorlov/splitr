package entity

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCommand_String(t *testing.T) {
	tests := []struct {
		name     string
		command  Command
		expected string
	}{
		{
			name:     "empty command",
			command:  Command{},
			expected: " ",
		},
		{
			name:     "executable only",
			command:  Command{Executable: "ping"},
			expected: "ping ",
		},
		{
			name:     "executable with single arg",
			command:  Command{Executable: "ping", Args: []string{"8.8.8.8"}},
			expected: "ping 8.8.8.8",
		},
		{
			name:     "executable with multiple args",
			command:  Command{Executable: "ssh", Args: []string{"-i", "key.pem", "user@host"}},
			expected: "ssh -i key.pem user@host",
		},
		{
			name:     "args only without executable",
			command:  Command{Args: []string{"arg1", "arg2"}},
			expected: " arg1 arg2",
		},
		{
			name:     "executable with empty args slice",
			command:  Command{Executable: "ls", Args: []string{}},
			expected: "ls ",
		},
		{
			name:     "executable with args containing spaces",
			command:  Command{Executable: "echo", Args: []string{"hello world", "test"}},
			expected: "echo hello world test",
		},
		{
			name:     "executable with special characters in args",
			command:  Command{Executable: "grep", Args: []string{"-r", "pattern.*", "/path/to/file"}},
			expected: "grep -r pattern.* /path/to/file",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.command.String()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestCommand_Fields(t *testing.T) {
	command := Command{
		Executable: "test-exe",
		Args:       []string{"arg1", "arg2", "arg3"},
	}

	assert.Equal(t, "test-exe", command.Executable)
	assert.Equal(t, []string{"arg1", "arg2", "arg3"}, command.Args)
	assert.Len(t, command.Args, 3)
}

func TestCommand_NilArgs(t *testing.T) {
	command := Command{
		Executable: "test",
		Args:       nil,
	}

	result := command.String()
	assert.Equal(t, "test ", result)
}
