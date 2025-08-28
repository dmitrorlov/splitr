package app

import (
	"fmt"
	"log/slog"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// CreateMenu creates the macOS application menu.
func (a *App) CreateMenu() *menu.Menu {
	m := menu.NewMenu()

	// Add app menu for macOS
	appMenu := m.AddSubmenu(a.appName)
	appMenu.AddText("About Splitr...", nil, func(_ *menu.CallbackData) {
		a.about()
	})
	appMenu.AddText("Check for Updates...", nil, func(_ *menu.CallbackData) {
		a.checkForUpdates()
	})
	appMenu.AddSeparator()
	appMenu.AddText("View Logs", nil, func(_ *menu.CallbackData) {
		err := a.commandUC.OpenInFinder(a.ctx, a.wailsLogger.FilePath())
		if err != nil {
			slog.Error("failed to reveal log file", "error", err)
		}
	})
	appMenu.AddSeparator()
	appMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		wailsRuntime.Quit(a.ctx)
	})

	// Add edit menu for copy/paste functionality
	m.Append(menu.EditMenu())
	return m
}

// about shows the about dialog.
func (a *App) about() {
	_, err := wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
		Type:    wailsRuntime.InfoDialog,
		Title:   "About",
		Message: fmt.Sprintf("Version: %s\nAuthor: %s\nEmail: %s", a.appVersion, a.authorName, a.authorEmail),
	})
	if err != nil {
		slog.Error("failed to show about dialog", "error", err)
	}
}

// checkForUpdates checks for updates and shows appropriate dialog.
func (a *App) checkForUpdates() {
	updateInfo, err := a.updateUC.CheckForUpdates()
	if err != nil {
		slog.Error("failed to check for updates", "error", err)
		_, dialogErr := wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
			Type:    wailsRuntime.ErrorDialog,
			Title:   "Update Check Failed",
			Message: fmt.Sprintf("Failed to check for updates: %v", err),
		})
		if dialogErr != nil {
			slog.Error("failed to show error dialog", "error", dialogErr)
		}
		return
	}

	if !updateInfo.Available {
		_, dialogErr := wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
			Type:    wailsRuntime.InfoDialog,
			Title:   "No Updates Available",
			Message: fmt.Sprintf("You're running the latest version (%s).", updateInfo.CurrentVersion),
		})
		if dialogErr != nil {
			slog.Error("failed to show no updates dialog", "error", dialogErr)
		}
		return
	}

	// Show update available dialog with installation options.
	message := fmt.Sprintf(`A new version is available!

Current Version: %s
Latest Version: %s
Published: %s

To update:
1. Install via Homebrew: %s
2. Or download manually from GitHub

Would you like to open the release page?`,
		updateInfo.CurrentVersion,
		updateInfo.LatestVersion,
		updateInfo.PublishedAtAsString,
		updateInfo.HomebrewCommand)

	response, err := wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
		Type:          wailsRuntime.QuestionDialog,
		Title:         "Update Available",
		Message:       message,
		Buttons:       []string{"Open Release Page", "Copy Homebrew Command", "Cancel"},
		DefaultButton: "Open Release Page",
		CancelButton:  "Cancel",
	})
	if err != nil {
		slog.Error("failed to show update dialog", "error", err)
		return
	}

	switch response {
	case "Open Release Page":
		wailsRuntime.BrowserOpenURL(a.ctx, updateInfo.ReleasePageURL)
	case "Copy Homebrew Command":
		clipErr := wailsRuntime.ClipboardSetText(a.ctx, updateInfo.HomebrewCommand)
		if clipErr != nil {
			slog.Error("failed to copy to clipboard", "error", clipErr)
			return
		}

		_, err = wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
			Type:    wailsRuntime.InfoDialog,
			Title:   "Copied to Clipboard",
			Message: fmt.Sprintf("Command copied to clipboard:\n%s", updateInfo.HomebrewCommand),
		})
		if err != nil {
			slog.Error("failed to show message dialog", "error", err)
			return
		}
	}
}
