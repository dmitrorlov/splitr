package entity

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRelease_JSONMarshalUnmarshal(t *testing.T) {
	publishedAt := time.Date(2023, 12, 1, 15, 30, 0, 0, time.UTC)

	release := Release{
		TagName:     "v1.2.3",
		Name:        "Test Release",
		Body:        "Release notes content",
		Draft:       false,
		Prerelease:  true,
		PublishedAt: publishedAt,
		Assets: []Asset{
			{
				Name:               "app.exe",
				BrowserDownloadURL: "https://example.com/download/app.exe",
				Size:               1024000,
			},
		},
		HTMLURL: "https://github.com/user/repo/releases/tag/v1.2.3",
	}

	data, err := json.Marshal(release)
	require.NoError(t, err)

	var unmarshaled Release
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, release.TagName, unmarshaled.TagName)
	assert.Equal(t, release.Name, unmarshaled.Name)
	assert.Equal(t, release.Body, unmarshaled.Body)
	assert.Equal(t, release.Draft, unmarshaled.Draft)
	assert.Equal(t, release.Prerelease, unmarshaled.Prerelease)
	assert.True(t, release.PublishedAt.Equal(unmarshaled.PublishedAt))
	assert.Equal(t, release.HTMLURL, unmarshaled.HTMLURL)
	require.Len(t, unmarshaled.Assets, 1)
	assert.Equal(t, release.Assets[0], unmarshaled.Assets[0])
}

func TestRelease_EmptyFields(t *testing.T) {
	release := Release{}

	data, err := json.Marshal(release)
	require.NoError(t, err)

	var unmarshaled Release
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, release, unmarshaled)
}

func TestAsset_JSONMarshalUnmarshal(t *testing.T) {
	asset := Asset{
		Name:               "test-app-v1.0.0.zip",
		BrowserDownloadURL: "https://github.com/user/repo/releases/download/v1.0.0/test-app-v1.0.0.zip",
		Size:               2048576,
	}

	data, err := json.Marshal(asset)
	require.NoError(t, err)

	var unmarshaled Asset
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, asset, unmarshaled)
}

func TestAsset_ZeroSize(t *testing.T) {
	asset := Asset{
		Name:               "empty-file",
		BrowserDownloadURL: "https://example.com/empty",
		Size:               0,
	}

	data, err := json.Marshal(asset)
	require.NoError(t, err)

	var unmarshaled Asset
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, asset, unmarshaled)
}

func TestUpdateInfo_JSONMarshalUnmarshal(t *testing.T) {
	updateInfo := UpdateInfo{
		Available:           true,
		CurrentVersion:      "v1.0.0",
		LatestVersion:       "v1.2.3",
		ReleaseNotes:        "New features and bug fixes",
		DownloadURL:         "https://example.com/download/v1.2.3",
		ReleasePageURL:      "https://github.com/user/repo/releases/tag/v1.2.3",
		PublishedAtAsString: "2023-12-01T15:30:00Z",
		HomebrewCommand:     "brew upgrade my-app",
	}

	data, err := json.Marshal(updateInfo)
	require.NoError(t, err)

	var unmarshaled UpdateInfo
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, updateInfo, unmarshaled)
}

func TestUpdateInfo_NoUpdateAvailable(t *testing.T) {
	updateInfo := UpdateInfo{
		Available:      false,
		CurrentVersion: "v1.2.3",
		LatestVersion:  "v1.2.3",
	}

	data, err := json.Marshal(updateInfo)
	require.NoError(t, err)

	var unmarshaled UpdateInfo
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, updateInfo, unmarshaled)
	assert.False(t, unmarshaled.Available)
}

func TestUpdateInfo_EmptyValues(t *testing.T) {
	updateInfo := UpdateInfo{}

	data, err := json.Marshal(updateInfo)
	require.NoError(t, err)

	var unmarshaled UpdateInfo
	err = json.Unmarshal(data, &unmarshaled)
	require.NoError(t, err)

	assert.Equal(t, updateInfo, unmarshaled)
	assert.False(t, unmarshaled.Available)
}
