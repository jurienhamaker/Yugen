package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sarulabs/di/v2"
)

type VoteHandler struct {
	container *di.Container
}

func GetVoteHandler(container *di.Container) *VoteHandler {
	return &VoteHandler{
		container: container,
	}
}

func (handler *VoteHandler) AddRoutes(app *fiber.App) {
	app.Get("/vote/:app", handler.handleGetVoteAppHandler)
}

func (handler *VoteHandler) handleGetVoteAppHandler(c *fiber.Ctx) error {
	return c.SendString("Hello from Vote!")
}
