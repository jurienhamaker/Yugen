package utils

import (
	"context"
	"log"
	"os"
	"time"

	zaploki "github.com/paul-milne/zap-loki"
	prettyconsole "github.com/thessem/zap-prettyconsole"
	"go.uber.org/zap"
	"jurien.dev/yugen/shared/static"
)

var Logger *zap.SugaredLogger

func CreateLogger(appName string) *zap.SugaredLogger {
	logger, err := zap.NewProduction()
	if err != nil {
		log.Panic(err)
	}

	environment := "production"
	if os.Getenv(static.Env) != "production" {
		logger = prettyconsole.NewLogger(zap.DebugLevel)

		environment = os.Getenv(static.Env)
	}

	if err != nil {
		log.Panic(err)
	}

	if len(os.Getenv(static.EnvLokiHost)) > 0 && environment == "production" {
		zapConfig := zap.NewProductionConfig()

		logger.Info("Received loki endpoint, setting up hook...")
		logger.Debug(os.Getenv(static.EnvLokiHost))

		loki := zaploki.New(context.Background(), zaploki.Config{
			Url:          os.Getenv(static.EnvLokiHost),
			BatchMaxSize: 1000,
			BatchMaxWait: 10 * time.Second,
			Labels: map[string]string{
				"app":         appName,
				"environment": environment,
			},
			Username: os.Getenv(static.EnvLokiUsername),
			Password: os.Getenv(static.EnvLokiPassword),
		})

		logger, err = loki.WithCreateLogger(zapConfig)
	}

	if err != nil {
		log.Panic(err)
	}

	Logger = logger.Sugar()

	return Logger
}