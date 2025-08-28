package update

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	semver "github.com/hashicorp/go-version"

	"github.com/dmitrorlov/splitr/backend/config"
	"github.com/dmitrorlov/splitr/backend/entity"
)

const (
	publisedAtDateFormat = "2006-01-02 15:04:05"
	assetSuffix          = "macos-arm64.zip"
	brewUpdateCommand    = "brew upgrade splitr"
	defaultHTTPTimeout   = 10 * time.Second

	githubReleaseURL = "https://api.github.com/repos/%s/%s/releases/latest"
)

// Update handles update checking.
type Update struct {
	appName    string
	appVersion string
	githubCfg  *config.GitHub
	httpClient *http.Client
}

// New creates a new update checker.
func New(appName, appVersion string, githubCfg *config.GitHub) *Update {
	return &Update{
		appName:    appName,
		appVersion: appVersion,
		githubCfg:  githubCfg,
		httpClient: &http.Client{
			Timeout: defaultHTTPTimeout,
		},
	}
}

func (u *Update) CheckForUpdates() (*entity.UpdateInfo, error) {
	url := fmt.Sprintf(githubReleaseURL, u.githubCfg.RepoOwner, u.githubCfg.RepoName)
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set User-Agent header (GitHub API requires it)
	req.Header.Set("User-Agent", fmt.Sprintf("%s/%s", u.appName, u.appVersion))

	// Add authentication header if GitHub token is available
	token := u.githubCfg.Token
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := u.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch latest release: %w", err)
	}
	defer resp.Body.Close()

	// Handle different HTTP status codes with specific error messages
	switch resp.StatusCode {
	case http.StatusOK:
		// Continue with processing
	case http.StatusNotFound:
		if token == "" {
			return nil, errors.New(
				"repository not found or private - GitHub token required. Set SPLITR_GITHUB_TOKEN environment variable with a personal access token",
			)
		}
		return nil, fmt.Errorf(
			"repository '%s/%s' not found or no releases available",
			u.githubCfg.RepoOwner,
			u.githubCfg.RepoName,
		)
	case http.StatusUnauthorized:
		return nil, errors.New("GitHub API authentication failed - check your SPLITR_GITHUB_TOKEN")
	case http.StatusForbidden:
		return nil, errors.New("GitHub API access forbidden - token may lack required permissions")
	case http.StatusTooManyRequests:
		return nil, errors.New(
			"GitHub API rate limit exceeded - try again later or use authentication",
		)
	default:
		return nil, fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var release entity.Release
	if decodeErr := json.NewDecoder(resp.Body).Decode(&release); decodeErr != nil {
		return nil, fmt.Errorf("failed to decode release response: %w", decodeErr)
	}

	// Skip draft and prerelease versions
	if release.Draft || release.Prerelease {
		return &entity.UpdateInfo{
			Available:      false,
			CurrentVersion: u.appVersion,
			LatestVersion:  u.appVersion,
		}, nil
	}

	updateInfo := &entity.UpdateInfo{
		CurrentVersion:      u.appVersion,
		LatestVersion:       release.TagName,
		ReleaseNotes:        release.Body,
		ReleasePageURL:      release.HTMLURL,
		PublishedAtAsString: release.PublishedAt.Format(publisedAtDateFormat),
		HomebrewCommand:     brewUpdateCommand,
	}

	for _, asset := range release.Assets {
		if strings.Contains(asset.Name, assetSuffix) {
			updateInfo.DownloadURL = asset.BrowserDownloadURL
			break
		}
	}

	// Check if update is available (simple string comparison for now)
	updateInfo.Available = u.isNewerVersion(release.TagName, u.appVersion)
	return updateInfo, nil
}

// isNewerVersion compares two version strings using semantic versioning.
func (u *Update) isNewerVersion(latest, current string) bool {
	// Handle dev version
	if current == "dev" || current == "" {
		return true
	}

	simpleStringComparison := strings.TrimPrefix(latest, "v") > strings.TrimPrefix(current, "v")

	// Parse versions using HashiCorp go-version
	latestVersion, err := semver.NewVersion(latest)
	if err != nil {
		// Fallback to string comparison if parsing fails
		return simpleStringComparison
	}

	currentVersion, err := semver.NewVersion(current)
	if err != nil {
		// Fallback to string comparison if parsing fails
		return simpleStringComparison
	}

	// Use semantic version comparison
	return latestVersion.GreaterThan(currentVersion)
}
