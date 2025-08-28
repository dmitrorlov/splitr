package config

import (
	"fmt"

	"github.com/ilyakaznacheev/cleanenv"

	"github.com/dmitrorlov/splitr/backend/pkg/logging"
)

type Config struct {
	Logging logging.Config

	GitHub GitHub
}

func New() (*Config, error) {
	cfg := &Config{}
	err := cleanenv.ReadEnv(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to read env: %w", err)
	}

	return cfg, err
}
