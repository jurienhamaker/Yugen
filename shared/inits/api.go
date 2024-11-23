package inits

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/api"
	"jurien.dev/yugen/shared/static"
)

func listen(container *di.Container, app *fiber.App) {
	log.Fatal(app.Listen(fmt.Sprintf("%s:%s", os.Getenv(static.EnvApiHost), os.Getenv(static.EnvApiPort))))
}

func InitAPI(container *di.Container) (app *fiber.App) {
	app = fiber.New()

	router := app.Group("/api")
	api.AddSharedRoutes(app, router, container)
	api.AddSharedMiddleware(app)

	go listen(container, app)

	return
}
