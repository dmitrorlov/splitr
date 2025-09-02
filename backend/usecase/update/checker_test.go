package update

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/dmitrorlov/splitr/backend/config"
	"github.com/dmitrorlov/splitr/backend/entity"
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
				t.Errorf(
					"isNewerVersion(%q, %q) = %v, want %v",
					tt.latest,
					tt.current,
					result,
					tt.expected,
				)
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
				t.Errorf(
					"isNewerVersion(%q, %q) = %v, want %v",
					tt.latest,
					tt.current,
					result,
					tt.expected,
				)
			}
		})
	}
}

// mockTransport implements http.RoundTripper for testing.
type mockTransport struct {
	response *http.Response
	err      error
}

func (m *mockTransport) RoundTrip(_ *http.Request) (*http.Response, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.response, nil
}

func newMockClient(statusCode int, body string, err error) *http.Client {
	if err != nil {
		return &http.Client{
			Transport: &mockTransport{err: err},
		}
	}

	resp := &http.Response{
		StatusCode: statusCode,
		Body:       io.NopCloser(strings.NewReader(body)),
		Header:     make(http.Header),
	}
	return &http.Client{
		Transport: &mockTransport{response: resp},
	}
}

func createValidReleaseJSON(
	tagName string,
	draft, prerelease bool,
	publishedAt time.Time,
	assets []entity.Asset,
) string {
	release := entity.Release{
		TagName:     tagName,
		Name:        "Release " + tagName,
		Body:        "Release notes for " + tagName,
		Draft:       draft,
		Prerelease:  prerelease,
		PublishedAt: publishedAt,
		Assets:      assets,
		HTMLURL:     "https://github.com/test/test/releases/tag/" + tagName,
	}

	jsonBytes, _ := json.Marshal(release)
	return string(jsonBytes)
}

func TestUpdate_CheckForUpdates_HTTPRequestCreationError(t *testing.T) {
	// Create an Update with invalid repo config that will cause URL formatting issues
	githubCfg := &config.GitHub{
		RepoOwner: "test\x7f", // Invalid character that should cause URL creation to fail
		RepoName:  "test",
	}
	update := New("test-app", "v1.0.0", githubCfg)

	_, err := update.CheckForUpdates()
	if err == nil {
		t.Fatal("expected error but got none")
	}
	if !strings.Contains(err.Error(), "failed to create request") {
		t.Errorf("expected error to contain 'failed to create request', got: %v", err)
	}
}

func TestUpdate_CheckForUpdates_HTTPClientError(t *testing.T) {
	githubCfg := &config.GitHub{
		RepoOwner: "test",
		RepoName:  "test",
	}
	update := New("test-app", "v1.0.0", githubCfg)
	update.httpClient = newMockClient(0, "", errors.New("network error"))

	_, err := update.CheckForUpdates()
	if err == nil {
		t.Fatal("expected error but got none")
	}
	if !strings.Contains(err.Error(), "failed to fetch latest release") {
		t.Errorf("expected error to contain 'failed to fetch latest release', got: %v", err)
	}
	if !strings.Contains(err.Error(), "network error") {
		t.Errorf("expected error to contain 'network error', got: %v", err)
	}
}

func TestUpdate_CheckForUpdates_HTTPStatusCodes(t *testing.T) {
	tests := []struct {
		name          string
		statusCode    int
		token         string
		expectedError string
	}{
		{
			name:          "404 without token",
			statusCode:    http.StatusNotFound,
			token:         "",
			expectedError: "repository not found or private - GitHub token required",
		},
		{
			name:          "404 with token",
			statusCode:    http.StatusNotFound,
			token:         "token123",
			expectedError: "repository 'test/test' not found or no releases available",
		},
		{
			name:          "401 unauthorized",
			statusCode:    http.StatusUnauthorized,
			token:         "invalid-token",
			expectedError: "GitHub API authentication failed - check your SPLITR_GITHUB_TOKEN",
		},
		{
			name:          "403 forbidden",
			statusCode:    http.StatusForbidden,
			token:         "token123",
			expectedError: "GitHub API access forbidden - token may lack required permissions",
		},
		{
			name:          "429 rate limit",
			statusCode:    http.StatusTooManyRequests,
			token:         "",
			expectedError: "GitHub API rate limit exceeded - try again later or use authentication",
		},
		{
			name:          "500 internal server error",
			statusCode:    http.StatusInternalServerError,
			token:         "",
			expectedError: "GitHub API returned status 500",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			githubCfg := &config.GitHub{
				RepoOwner: "test",
				RepoName:  "test",
				Token:     tt.token,
			}
			update := New("test-app", "v1.0.0", githubCfg)
			update.httpClient = newMockClient(tt.statusCode, "", nil)

			_, err := update.CheckForUpdates()
			if err == nil {
				t.Fatal("expected error but got none")
			}
			if !strings.Contains(err.Error(), tt.expectedError) {
				t.Errorf("expected error to contain %q, got: %v", tt.expectedError, err)
			}
		})
	}
}

func TestUpdate_CheckForUpdates_JSONDecodeError(t *testing.T) {
	githubCfg := &config.GitHub{
		RepoOwner: "test",
		RepoName:  "test",
	}
	update := New("test-app", "v1.0.0", githubCfg)
	update.httpClient = newMockClient(http.StatusOK, `{"tag_name":`, nil)

	_, err := update.CheckForUpdates()
	if err == nil {
		t.Fatal("expected error but got none")
	}
	if !strings.Contains(err.Error(), "failed to decode release response") {
		t.Errorf("expected error to contain 'failed to decode release response', got: %v", err)
	}
}

func TestUpdate_CheckForUpdates_DraftAndPrerelease(t *testing.T) {
	tests := []struct {
		name       string
		draft      bool
		prerelease bool
	}{
		{
			name:       "draft release",
			draft:      true,
			prerelease: false,
		},
		{
			name:       "prerelease",
			draft:      false,
			prerelease: true,
		},
		{
			name:       "draft prerelease",
			draft:      true,
			prerelease: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			githubCfg := &config.GitHub{
				RepoOwner: "test",
				RepoName:  "test",
			}
			update := New("test-app", "v1.0.0", githubCfg)

			publishedAt := time.Now()
			releaseJSON := createValidReleaseJSON(
				"v1.2.0",
				tt.draft,
				tt.prerelease,
				publishedAt,
				nil,
			)
			update.httpClient = newMockClient(http.StatusOK, releaseJSON, nil)

			updateInfo, err := update.CheckForUpdates()
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if updateInfo.Available != false {
				t.Errorf(
					"expected Available to be false for %s, got %v",
					tt.name,
					updateInfo.Available,
				)
			}
			if updateInfo.CurrentVersion != "v1.0.0" {
				t.Errorf(
					"expected CurrentVersion to be 'v1.0.0', got %q",
					updateInfo.CurrentVersion,
				)
			}
			if updateInfo.LatestVersion != "v1.0.0" {
				t.Errorf("expected LatestVersion to be 'v1.0.0', got %q", updateInfo.LatestVersion)
			}
		})
	}
}

func TestUpdate_CheckForUpdates_Success(t *testing.T) {
	githubCfg := &config.GitHub{
		RepoOwner: "test",
		RepoName:  "test",
		Token:     "test-token",
	}
	update := New("test-app", "v1.0.0", githubCfg)

	publishedAt := time.Date(2023, 12, 25, 10, 30, 0, 0, time.UTC)
	assets := []entity.Asset{
		{
			Name:               "other-asset.zip",
			BrowserDownloadURL: "https://github.com/test/test/releases/download/v1.2.0/other-asset.zip",
			Size:               1000,
		},
		{
			Name:               "test-app-v1.2.0-macos-arm64.zip",
			BrowserDownloadURL: "https://github.com/test/test/releases/download/v1.2.0/test-app-v1.2.0-macos-arm64.zip",
			Size:               5000,
		},
	}

	releaseJSON := createValidReleaseJSON("v1.2.0", false, false, publishedAt, assets)
	update.httpClient = newMockClient(http.StatusOK, releaseJSON, nil)

	updateInfo, err := update.CheckForUpdates()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify all fields
	if updateInfo.Available != true {
		t.Errorf("expected Available to be true, got %v", updateInfo.Available)
	}
	if updateInfo.CurrentVersion != "v1.0.0" {
		t.Errorf("expected CurrentVersion to be 'v1.0.0', got %q", updateInfo.CurrentVersion)
	}
	if updateInfo.LatestVersion != "v1.2.0" {
		t.Errorf("expected LatestVersion to be 'v1.2.0', got %q", updateInfo.LatestVersion)
	}
	if updateInfo.ReleaseNotes != "Release notes for v1.2.0" {
		t.Errorf(
			"expected ReleaseNotes to be 'Release notes for v1.2.0', got %q",
			updateInfo.ReleaseNotes,
		)
	}
	if updateInfo.ReleasePageURL != "https://github.com/test/test/releases/tag/v1.2.0" {
		t.Errorf(
			"expected ReleasePageURL to be 'https://github.com/test/test/releases/tag/v1.2.0', got %q",
			updateInfo.ReleasePageURL,
		)
	}
	expectedTime := "2023-12-25 10:30:00"
	if updateInfo.PublishedAtAsString != expectedTime {
		t.Errorf(
			"expected PublishedAtAsString to be %q, got %q",
			expectedTime,
			updateInfo.PublishedAtAsString,
		)
	}
	if updateInfo.HomebrewCommand != "brew upgrade splitr" {
		t.Errorf(
			"expected HomebrewCommand to be 'brew upgrade splitr', got %q",
			updateInfo.HomebrewCommand,
		)
	}
	expectedDownloadURL := "https://github.com/test/test/releases/download/v1.2.0/test-app-v1.2.0-macos-arm64.zip"
	if updateInfo.DownloadURL != expectedDownloadURL {
		t.Errorf(
			"expected DownloadURL to be %q, got %q",
			expectedDownloadURL,
			updateInfo.DownloadURL,
		)
	}
}

func TestUpdate_CheckForUpdates_NoMatchingAsset(t *testing.T) {
	githubCfg := &config.GitHub{
		RepoOwner: "test",
		RepoName:  "test",
	}
	update := New("test-app", "v1.0.0", githubCfg)

	publishedAt := time.Now()
	assets := []entity.Asset{
		{
			Name:               "other-asset.zip",
			BrowserDownloadURL: "https://github.com/test/test/releases/download/v1.2.0/other-asset.zip",
			Size:               1000,
		},
		{
			Name:               "windows-asset.exe",
			BrowserDownloadURL: "https://github.com/test/test/releases/download/v1.2.0/windows-asset.exe",
			Size:               2000,
		},
	}

	releaseJSON := createValidReleaseJSON("v1.2.0", false, false, publishedAt, assets)
	update.httpClient = newMockClient(http.StatusOK, releaseJSON, nil)

	updateInfo, err := update.CheckForUpdates()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if updateInfo.DownloadURL != "" {
		t.Errorf(
			"expected DownloadURL to be empty when no matching asset, got %q",
			updateInfo.DownloadURL,
		)
	}
}

func TestUpdate_CheckForUpdates_VersionComparisonEdgeCases(t *testing.T) {
	tests := []struct {
		name              string
		currentVersion    string
		latestVersion     string
		expectedAvailable bool
	}{
		{
			name:              "dev version always updates",
			currentVersion:    "dev",
			latestVersion:     "v1.0.0",
			expectedAvailable: true,
		},
		{
			name:              "empty version always updates",
			currentVersion:    "",
			latestVersion:     "v1.0.0",
			expectedAvailable: true,
		},
		{
			name:              "non-semver fallback to string comparison",
			currentVersion:    "abc",
			latestVersion:     "xyz",
			expectedAvailable: true,
		},
		{
			name:              "same version no update",
			currentVersion:    "v1.2.0",
			latestVersion:     "v1.2.0",
			expectedAvailable: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			githubCfg := &config.GitHub{
				RepoOwner: "test",
				RepoName:  "test",
			}
			update := New("test-app", tt.currentVersion, githubCfg)

			publishedAt := time.Now()
			releaseJSON := createValidReleaseJSON(tt.latestVersion, false, false, publishedAt, nil)
			update.httpClient = newMockClient(http.StatusOK, releaseJSON, nil)

			updateInfo, err := update.CheckForUpdates()
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if updateInfo.Available != tt.expectedAvailable {
				t.Errorf(
					"expected Available to be %v, got %v",
					tt.expectedAvailable,
					updateInfo.Available,
				)
			}
		})
	}
}

// TestUpdate_New verifies the constructor creates Update with correct fields.
func TestUpdate_New(t *testing.T) {
	githubCfg := &config.GitHub{
		RepoOwner: "owner",
		RepoName:  "repo",
		Token:     "token",
	}

	update := New("myapp", "v2.0.0", githubCfg)

	if update.appName != "myapp" {
		t.Errorf("expected appName to be 'myapp', got %q", update.appName)
	}
	if update.appVersion != "v2.0.0" {
		t.Errorf("expected appVersion to be 'v2.0.0', got %q", update.appVersion)
	}
	if update.githubCfg != githubCfg {
		t.Errorf("expected githubCfg to be the same reference")
	}
	if update.httpClient == nil {
		t.Error("expected httpClient to be initialized")
	}
	if update.httpClient.Timeout != defaultHTTPTimeout {
		t.Errorf("expected timeout to be %v, got %v", defaultHTTPTimeout, update.httpClient.Timeout)
	}
}
