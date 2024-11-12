package inits

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/api"
)

func InitAPI(container *di.Container) (app *fiber.App) {
	app = fiber.New()

	api.AddSharedRoutes(app, container)
	api.AddSharedMiddleware(app)

	return
}
