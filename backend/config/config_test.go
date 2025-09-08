package config

import (
	"errors"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setEnv(t *testing.T, key, value string) func() {
	t.Helper()
	orig, exists := os.LookupEnv(key)
	t.Setenv(key, value)

	return func() {
		if exists {
			t.Setenv(key, orig)
		} else {
			os.Unsetenv(key)
		}
	}
}

func clearEnv(t *testing.T, key string) func() {
	t.Helper()
	orig, exists := os.LookupEnv(key)
	os.Unsetenv(key)

	return func() {
		if exists {
			t.Setenv(key, orig)
		}
	}
}

func TestNew_Success_WithDefaults(t *testing.T) {
	restoreRepoOwner := clearEnv(t, "SPLITR_REPO_OWNER")
	defer restoreRepoOwner()

	restoreRepoName := clearEnv(t, "SPLITR_REPO_NAME")
	defer restoreRepoName()

	restoreToken := clearEnv(t, "SPLITR_GITHUB_TOKEN")
	defer restoreToken()

	cfg, err := New()

	require.NoError(t, err)
	assert.NotNil(t, cfg)
	assert.Equal(t, "dmitrorlov", cfg.GitHub.RepoOwner)
	assert.Equal(t, "splitr", cfg.GitHub.RepoName)
	assert.Empty(t, cfg.GitHub.Token)
}

func TestNew_Success_WithCustomValues(t *testing.T) {
	tests := []struct {
		name          string
		repoOwner     string
		repoName      string
		githubToken   string
		expectedOwner string
		expectedName  string
		expectedToken string
	}{
		{
			name:          "Custom owner",
			repoOwner:     "custom-owner",
			repoName:      "",
			githubToken:   "",
			expectedOwner: "custom-owner",
			expectedName:  "splitr",
			expectedToken: "",
		},
		{
			name:          "Custom repo name",
			repoOwner:     "",
			repoName:      "custom-repo",
			githubToken:   "",
			expectedOwner: "dmitrorlov",
			expectedName:  "custom-repo",
			expectedToken: "",
		},
		{
			name:          "Custom GitHub token",
			repoOwner:     "",
			repoName:      "",
			githubToken:   "ghp_token123",
			expectedOwner: "dmitrorlov",
			expectedName:  "splitr",
			expectedToken: "ghp_token123",
		},
		{
			name:          "All custom values",
			repoOwner:     "test-owner",
			repoName:      "test-repo",
			githubToken:   "ghp_testtoken",
			expectedOwner: "test-owner",
			expectedName:  "test-repo",
			expectedToken: "ghp_testtoken",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var restoreFuncs []func()

			if tt.repoOwner != "" {
				restoreFuncs = append(restoreFuncs, setEnv(t, "SPLITR_REPO_OWNER", tt.repoOwner))
			} else {
				restoreFuncs = append(restoreFuncs, clearEnv(t, "SPLITR_REPO_OWNER"))
			}

			if tt.repoName != "" {
				restoreFuncs = append(restoreFuncs, setEnv(t, "SPLITR_REPO_NAME", tt.repoName))
			} else {
				restoreFuncs = append(restoreFuncs, clearEnv(t, "SPLITR_REPO_NAME"))
			}

			if tt.githubToken != "" {
				restoreFuncs = append(restoreFuncs, setEnv(t, "SPLITR_GITHUB_TOKEN", tt.githubToken))
			} else {
				restoreFuncs = append(restoreFuncs, clearEnv(t, "SPLITR_GITHUB_TOKEN"))
			}

			defer func() {
				for _, restore := range restoreFuncs {
					restore()
				}
			}()

			cfg, err := New()

			require.NoError(t, err)
			assert.NotNil(t, cfg)
			assert.Equal(t, tt.expectedOwner, cfg.GitHub.RepoOwner)
			assert.Equal(t, tt.expectedName, cfg.GitHub.RepoName)
			assert.Equal(t, tt.expectedToken, cfg.GitHub.Token)
		})
	}
}

type loggingTestCase struct {
	name               string
	logLevel           string
	logMaxSizeMB       string
	logMaxBackups      string
	logMaxAgeDays      string
	logCompress        string
	logStderr          string
	expectedLogLevel   string
	expectedMaxSizeMB  uint8
	expectedMaxBackups uint8
	expectedMaxAgeDays uint8
	expectedCompress   bool
	expectedStderr     bool
}

func (tc loggingTestCase) setupEnvironment(t *testing.T) []func() {
	envVars := []struct {
		name  string
		value string
	}{
		{"SPLITR_LOG_LEVEL", tc.logLevel},
		{"SPLITR_LOG_MAX_SIZE_MB", tc.logMaxSizeMB},
		{"SPLITR_LOG_MAX_BACKUPS", tc.logMaxBackups},
		{"SPLITR_LOG_MAX_AGE_DAYS", tc.logMaxAgeDays},
		{"SPLITR_LOG_COMPRESS", tc.logCompress},
		{"SPLITR_LOG_STDERR", tc.logStderr},
	}

	var restoreFuncs []func()
	for _, envVar := range envVars {
		if envVar.value != "" {
			restoreFuncs = append(restoreFuncs, setEnv(t, envVar.name, envVar.value))
		} else {
			restoreFuncs = append(restoreFuncs, clearEnv(t, envVar.name))
		}
	}
	return restoreFuncs
}

func (tc loggingTestCase) assertConfig(t *testing.T, cfg *Config) {
	assert.Equal(t, tc.expectedLogLevel, cfg.Logging.LogLevel)
	assert.Equal(t, tc.expectedMaxSizeMB, cfg.Logging.LogMaxSizeMB)
	assert.Equal(t, tc.expectedMaxBackups, cfg.Logging.LogMaxBackups)
	assert.Equal(t, tc.expectedMaxAgeDays, cfg.Logging.LogMaxAgeDays)
	assert.Equal(t, tc.expectedCompress, cfg.Logging.LogCompress)
	assert.Equal(t, tc.expectedStderr, cfg.Logging.LogStderr)
}

func TestNew_WithLoggingConfig(t *testing.T) {
	tests := []loggingTestCase{
		{
			name:               "Default logging values",
			expectedLogLevel:   "info",
			expectedMaxSizeMB:  25,
			expectedMaxBackups: 5,
			expectedMaxAgeDays: 30,
			expectedCompress:   true,
			expectedStderr:     false,
		},
		{
			name:               "Custom logging values",
			logLevel:           "debug",
			logMaxSizeMB:       "50",
			logMaxBackups:      "10",
			logMaxAgeDays:      "60",
			logCompress:        "false",
			logStderr:          "true",
			expectedLogLevel:   "debug",
			expectedMaxSizeMB:  50,
			expectedMaxBackups: 10,
			expectedMaxAgeDays: 60,
			expectedCompress:   false,
			expectedStderr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			restoreFuncs := tt.setupEnvironment(t)
			defer func() {
				for _, restore := range restoreFuncs {
					restore()
				}
			}()

			cfg, err := New()
			require.NoError(t, err)
			assert.NotNil(t, cfg)
			tt.assertConfig(t, cfg)
		})
	}
}

func TestNew_ErrorPropagation(t *testing.T) {
	expectedErr := errors.New("test read env error")
	mockEnvReader := func(interface{}) error {
		return expectedErr
	}

	cfg, err := newWithEnvReader(mockEnvReader)

	require.Error(t, err)
	assert.Nil(t, cfg)
	assert.Contains(t, err.Error(), "failed to read env")
	assert.Contains(t, err.Error(), expectedErr.Error())
}
