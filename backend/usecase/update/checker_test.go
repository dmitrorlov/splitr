package update

import (
	"testing"

	"github.com/dmitrorlov/splitr/backend/config"
)

func TestUpdate_isNewerVersion(t *testing.T) {
	tests := []struct {
		name     string
		latest   string
		current  string
		expected bool
	}{
		// Basic semantic versioning tests
		{
			name:     "newer major version",
			latest:   "v2.0.0",
			current:  "v1.0.0",
			expected: true,
		},
		{
			name:     "newer minor version",
			latest:   "v1.1.0",
			current:  "v1.0.0",
			expected: true,
		},
		{
			name:     "newer patch version",
			latest:   "v1.0.1",
			current:  "v1.0.0",
			expected: true,
		},
		{
			name:     "same version",
			latest:   "v1.0.0",
			current:  "v1.0.0",
			expected: false,
		},
		{
			name:     "older version",
			latest:   "v1.0.0",
			current:  "v1.1.0",
			expected: false,
		},
		// Version without 'v' prefix
		{
			name:     "newer version without v prefix",
			latest:   "1.1.0",
			current:  "1.0.0",
			expected: true,
		},
		{
			name:     "mixed v prefix",
			latest:   "v1.1.0",
			current:  "1.0.0",
			expected: true,
		},
		{
			name:     "mixed v prefix reverse",
			latest:   "1.1.0",
			current:  "v1.0.0",
			expected: true,
		},
		// Pre-release versions
		{
			name:     "release vs pre-release",
			latest:   "v1.0.0",
			current:  "v1.0.0-alpha.1",
			expected: true,
		},
		{
			name:     "newer pre-release",
			latest:   "v1.0.0-beta.1",
			current:  "v1.0.0-alpha.1",
			expected: true,
		},
		{
			name:     "newer pre-release version",
			latest:   "v1.0.0-alpha.2",
			current:  "v1.0.0-alpha.1",
			expected: true,
		},
		// Dev version (special case)
		{
			name:     "dev version should always update",
			latest:   "v1.0.0",
			current:  "dev",
			expected: true,
		},
		{
			name:     "empty version should always update",
			latest:   "v1.0.0",
			current:  "",
			expected: true,
		},
		// Complex versioning scenarios
		{
			name:     "multi-digit versions",
			latest:   "v10.2.15",
			current:  "v9.11.20",
			expected: true,
		},
		{
			name:     "multi-digit same major",
			latest:   "v1.12.0",
			current:  "v1.2.0",
			expected: true,
		},
		// Metadata (should be ignored in comparison)
		{
			name:     "with build metadata",
			latest:   "v1.0.0+20230101",
			current:  "v1.0.0+20221231",
			expected: false,
		},
		{
			name:     "different build metadata",
			latest:   "v1.1.0+build.1",
			current:  "v1.0.0+build.2",
			expected: true,
		},
		// Edge cases that might fall back to string comparison
		{
			name:     "invalid semver latest",
			latest:   "latest",
			current:  "v1.0.0",
			expected: true, // "latest" > "1.0.0" in string comparison
		},
		{
			name:     "invalid semver current",
			latest:   "v1.0.0",
			current:  "invalid",
			expected: false, // "1.0.0" < "invalid" in string comparison
		},
		{
			name:     "both invalid semver",
			latest:   "xyz",
			current:  "abc",
			expected: true, // "xyz" > "abc" in string comparison
		},
	}

	// Create a minimal Update instance for testing
	githubCfg := &config.GitHub{
		RepoOwner: "test",
		RepoName:  "test",
	}
	update := New("test-app", "v1.0.0", githubCfg)

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := update.isNewerVersion(tt.latest, tt.current)
			if result != tt.expected {
				t.Errorf("isNewerVersion(%q, %q) = %v, want %v", tt.latest, tt.current, result, tt.expected)
			}
		})
	}
}

func TestUpdate_isNewerVersion_RealWorldScenarios(t *testing.T) {
	tests := []struct {
		name     string
		latest   string
		current  string
		expected bool
	}{
		// Real-world version patterns
		{
			name:     "typical app versions",
			latest:   "v1.2.3",
			current:  "v1.2.2",
			expected: true,
		},
		{
			name:     "major version jump",
			latest:   "v2.0.0",
			current:  "v1.99.99",
			expected: true,
		},
		{
			name:     "kubernetes style",
			latest:   "v1.28.2",
			current:  "v1.27.10",
			expected: true,
		},
		{
			name:     "docker style",
			latest:   "24.0.7",
			current:  "24.0.6",
			expected: true,
		},
		{
			name:     "go version style",
			latest:   "1.21.5",
			current:  "1.21.4",
			expected: true,
		},
		// Release candidates and betas
		{
			name:     "rc to release",
			latest:   "v1.0.0",
			current:  "v1.0.0-rc.1",
			expected: true,
		},
		{
			name:     "beta to rc",
			latest:   "v1.0.0-rc.1",
			current:  "v1.0.0-beta.1",
			expected: true,
		},
		{
			name:     "alpha to beta",
			latest:   "v1.0.0-beta.1",
			current:  "v1.0.0-alpha.1",
			expected: true,
		},
	}

	githubCfg := &config.GitHub{
		RepoOwner: "test",
		RepoName:  "test",
	}
	update := New("test-app", "v1.0.0", githubCfg)

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := update.isNewerVersion(tt.latest, tt.current)
			if result != tt.expected {
				t.Errorf("isNewerVersion(%q, %q) = %v, want %v", tt.latest, tt.current, result, tt.expected)
			}
		})
	}
}
