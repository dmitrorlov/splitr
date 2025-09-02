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

type envReader func(interface{}) error

func New() (*Config, error) {
	return newWithEnvReader(cleanenv.ReadEnv)
}

func newWithEnvReader(readEnv envReader) (*Config, error) {
	cfg := &Config{}
	err := readEnv(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to read env: %w", err)
	}

	return cfg, err
}
