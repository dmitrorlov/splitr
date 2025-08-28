package entity

import (
	"time"
)

// Release represents a GitHub release.
type Release struct {
	TagName     string    `json:"tag_name"`
	Name        string    `json:"name"`
	Body        string    `json:"body"`
	Draft       bool      `json:"draft"`
	Prerelease  bool      `json:"prerelease"`
	PublishedAt time.Time `json:"published_at"`
	Assets      []Asset   `json:"assets"`
	HTMLURL     string    `json:"html_url"`
}

// Asset represents a GitHub release asset.
type Asset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Size               int64  `json:"size"`
}

// UpdateInfo represents update information.
type UpdateInfo struct {
	Available           bool   `json:"available"`
	CurrentVersion      string `json:"current_version"`
	LatestVersion       string `json:"latest_version"`
	ReleaseNotes        string `json:"release_notes"`
	DownloadURL         string `json:"download_url"`
	ReleasePageURL      string `json:"release_page_url"`
	PublishedAtAsString string `json:"published_at"`
	HomebrewCommand     string `json:"homebrew_command"`
}
