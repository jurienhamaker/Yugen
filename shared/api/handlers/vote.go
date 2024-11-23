package handlers

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/sarulabs/di/v2"
	"github.com/zekrotja/dgrs"
	"jurien.dev/yugen/shared/static"
)

type TopGGBody struct {
	BotID string `json:"bot"`
	ID    string `json:"user"`
}

type DiscordBotListBody struct {
	Admin bool   `json:"admin"`
	ID    string `json:"id"`
}

type VoteHandler struct {
	container *di.Container
}

func GetVoteHandler(container *di.Container) *VoteHandler {
	return &VoteHandler{
		container: container,
	}
}

func (handler *VoteHandler) AddRoutes(app *fiber.App, router fiber.Router) {
	topgg := router.Group("/top-gg")
	topgg.Use(handler.authMiddleware)
	topgg.Post("/webhook", handler.handleTopGG)

	discordbotlist := router.Group("/discordbotlist")
	discordbotlist.Use(handler.authMiddleware)
	discordbotlist.Post("/webhook", handler.handleDiscordBotList)
}

func (handler *VoteHandler) authMiddleware(c *fiber.Ctx) error {
	headers := c.GetReqHeaders()

	authHeader := headers["Authorization"]
	if len(authHeader) == 0 {
		return c.SendStatus(403)
	}

	authHeaderValue := authHeader[0]
	if len(authHeaderValue) == 0 {
		return c.SendStatus(403)
	}

	if authHeaderValue != os.Getenv(static.EnvWebhookAuthorizationToken) {
		return c.SendStatus(403)
	}

	// Continue to the next middleware or route handling function
	return c.Next()
}

func (handler *VoteHandler) handleTopGG(c *fiber.Ctx) error {
	body := new(TopGGBody)

	if err := c.BodyParser(body); err != nil {
		return err
	}

	if len(body.BotID) == 0 {
		return c.Status(400).SendString("Missing bot ID in body")
	}

	if len(body.ID) == 0 {
		return c.Status(400).SendString("Missing user ID in body")
	}

	state := handler.container.Get(static.DiState).(*dgrs.State)
	self, err := state.SelfUser()
	if err != nil {
		return err
	}

	if body.BotID != self.ID {
		return c.Status(400).SendString("Bot ID does not match bot user")
	}

	go handler.handleVote(body.ID, "top.gg")

	return c.SendStatus(200)
}

func (handler *VoteHandler) handleDiscordBotList(c *fiber.Ctx) error {
	body := new(DiscordBotListBody)

	if err := c.BodyParser(body); err != nil {
		return err
	}

	if body.Admin {
		return c.SendStatus(200)
	}

	if len(body.ID) == 0 {
		return c.Status(400).SendString("Missing user ID in body")
	}

	go handler.handleVote(body.ID, "discordbotlist")

	return c.SendStatus(200)
}

func (handler VoteHandler) handleVote(userID string, source string) {
	voteRewardHandler, err := handler.container.SafeGet(static.DiVoteHandler)
	if err != nil {
		return
	}

	voteRewardHandler.(func(userID string, source string) error)(userID, source)
}
