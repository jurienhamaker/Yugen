package inits

import (
	"fmt"
	"os"

	"github.com/gofiber/contrib/fiberzap/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/api"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

func listen(app *fiber.App) {
	utils.Logger.Info("Initializing api...")
	utils.Logger.Fatal(app.Listen(fmt.Sprintf("%s:%s", os.Getenv(static.EnvApiHost), os.Getenv(static.EnvApiPort))))
}

func InitAPI(container *di.Container) (app *fiber.App) {
	app = fiber.New(fiber.Config{
		DisableStartupMessage: true,
	})

	app.Use(fiberzap.New(fiberzap.Config{
		Logger:   utils.Logger.Desugar(),
		SkipURIs: []string{"/api", "/api/monitor", "/api/health", "/api/metrics"},
	}))

	router := app.Group("/api")
	api.AddSharedRoutes(app, router, container)
	api.AddSharedMiddleware(app)

	go listen(app)

	return
}
