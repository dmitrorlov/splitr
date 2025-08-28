//nolint:gochecknoglobals // build
package main

import (
	"embed"
	"log/slog"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"github.com/dmitrorlov/splitr/backend/app"
	"github.com/dmitrorlov/splitr/backend/config"
	"github.com/dmitrorlov/splitr/backend/pkg/database"
	"github.com/dmitrorlov/splitr/backend/pkg/logging"
	"github.com/dmitrorlov/splitr/backend/storage/host"
	"github.com/dmitrorlov/splitr/backend/storage/network"
	"github.com/dmitrorlov/splitr/backend/storage/networkhost"
	"github.com/dmitrorlov/splitr/backend/storage/networkhostsetup"
	commandUsecase "github.com/dmitrorlov/splitr/backend/usecase/command"
	hostUsecase "github.com/dmitrorlov/splitr/backend/usecase/host"
	networkUsecase "github.com/dmitrorlov/splitr/backend/usecase/network"
	networkhostUsecase "github.com/dmitrorlov/splitr/backend/usecase/networkhost"
	networkhostsetupUsecase "github.com/dmitrorlov/splitr/backend/usecase/networkhostsetup"
	updateUsecase "github.com/dmitrorlov/splitr/backend/usecase/update"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed migrations
var migrationsFS embed.FS

var (
	appName     = "Splitr"
	authorName  = "Unknown"
	authorEmail = "Unknown"
	version     = "dev"
)

const (
	defaultWindowWidth  = 650
	defaultWindowHeight = 850
	defaultColorR       = 27
	defaultColorG       = 38
	defaultColorB       = 54
)

func main() {
	appConfig, err := config.New()
	if err != nil {
		slog.Error("failed to create config", "error", err)
		return
	}

	wailsLogger, err := logging.New(&appConfig.Logging, appName)
	if err != nil {
		slog.Error("failed to create logger", "error", err)
		return
	}
	slog.Info("logging initialized", "filepath", wailsLogger.FilePath())

	db, err := database.New(appName, migrationsFS)
	if err != nil {
		slog.Error("failed to initialize database", "error", err)
		return
	}

	txManager, err := database.NewTxManager(db)
	if err != nil {
		slog.Error("failed to initialize transaction manager", "error", err)
		return
	}

	hostStorage := host.New(db)
	networkStorage := network.New(db)
	networkhostStorage := networkhost.New(db)
	networkhostsetupStorage := networkhostsetup.New(db)

	commandUC := commandUsecase.NewExecutor()
	hostUC := hostUsecase.New(hostStorage)
	networkHostSetupUC := networkhostsetupUsecase.New(
		txManager,
		commandUC,
		networkStorage,
		networkhostStorage,
		networkhostsetupStorage,
	)
	networkUC := networkUsecase.New(commandUC, networkStorage, networkHostSetupUC)
	networkHostUC := networkhostUsecase.New(
		txManager,
		networkHostSetupUC,
		networkStorage,
		networkhostStorage,
	)
	updateUC := updateUsecase.New(appName, version, &appConfig.GitHub)
	app := app.New(
		appName,
		version,
		authorName,
		authorEmail,
		db,
		wailsLogger,
		commandUC,
		hostUC,
		networkUC,
		networkHostUC,
		networkHostSetupUC,
		updateUC,
	)
	err = wails.Run(&options.App{
		Title:  appName,
		Width:  defaultWindowWidth,
		Height: defaultWindowHeight,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: defaultColorR, G: defaultColorG, B: defaultColorB, A: 1},
		OnStartup:        app.OnStartup,
		OnBeforeClose:    app.OnBeforeClose,
		Bind:             []any{app},
		Menu:             app.CreateMenu(),
		Logger:           wailsLogger,
	})
	if err != nil {
		slog.Error("failed to run application", "error", err)
	}
}
