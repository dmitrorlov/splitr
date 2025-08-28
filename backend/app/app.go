package app

import (
	"context"
	"log/slog"

	"github.com/dmitrorlov/splitr/backend/pkg/database"
	"github.com/dmitrorlov/splitr/backend/pkg/logging"
	"github.com/dmitrorlov/splitr/backend/usecase"
)

type App struct {
	appName     string
	appVersion  string
	authorName  string
	authorEmail string

	ctx context.Context

	db          *database.Database
	wailsLogger *logging.WailsAdapter

	commandUC          usecase.CommandExecutor
	hostUC             usecase.Host
	networkUC          usecase.Network
	networkHostUC      usecase.NetworkHost
	networkHostSetupUC usecase.NetworkHostSetup
	updateUC           usecase.Update
}

func New(
	appName, appVersion, authorName, authorEmail string,
	db *database.Database,
	wailsLogger *logging.WailsAdapter,
	commandUC usecase.CommandExecutor,
	hostUC usecase.Host,
	networkUC usecase.Network,
	networkHostUC usecase.NetworkHost,
	networkHostSetupUC usecase.NetworkHostSetup,
	updateUC usecase.Update,
) *App {
	return &App{
		appName:     appName,
		appVersion:  appVersion,
		authorName:  authorName,
		authorEmail: authorEmail,

		db:          db,
		wailsLogger: wailsLogger,

		commandUC:          commandUC,
		hostUC:             hostUC,
		networkUC:          networkUC,
		networkHostUC:      networkHostUC,
		networkHostSetupUC: networkHostSetupUC,
		updateUC:           updateUC,
	}
}

func (a *App) OnStartup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) OnBeforeClose(_ context.Context) bool {
	if a.db != nil {
		err := a.db.Close()
		if err != nil {
			slog.Error("failed to close database", "error", err)
			return false
		}
	}

	return false
}
