package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/monitor"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/api/handlers"
)

func AddSharedRoutes(app *fiber.App, container *di.Container) {
	app.Get("/monitor", monitor.New())

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	// Custom shared handlers
	vote := handlers.GetVoteHandler(container)
	vote.AddRoutes(app)
}
