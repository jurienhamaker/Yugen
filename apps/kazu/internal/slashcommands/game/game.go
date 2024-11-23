package slashcommands

import (
	"fmt"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kazu/internal/services"
	local "jurien.dev/yugen/kazu/internal/static"
	localUtils "jurien.dev/yugen/kazu/internal/utils"
	"jurien.dev/yugen/kazu/prisma/db"
	"jurien.dev/yugen/shared/middlewares"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

type GameModule struct {
	container *di.Container
	settings  *services.SettingsService
	game      *services.GameService
}

func GetGameModule(container *di.Container) *GameModule {
	return &GameModule{
		container: container,
		settings:  container.Get(static.DiSettings).(*services.SettingsService),
		game:      container.Get(local.DiGame).(*services.GameService),
	}
}

func (m *GameModule) startGame(ctx *disgolf.Ctx, recreate bool) {
	utils.Defer(ctx, true)

	settings, err := m.settings.GetByGuildId(ctx.Interaction.GuildID)
	if err != nil {
		return
	}

	channelId, ok := settings.ChannelID()
	if !ok {
		localUtils.NoSettingsReply(ctx, m.container, true)
		return
	}

	startingNumber := 1

	startingNumberOption := ctx.Options["starting-number"]

	if startingNumberOption != nil {
		startingNumber = int(startingNumberOption.IntValue())
	}

	_, started, err := m.game.Start(
		ctx.Interaction.GuildID,
		db.GameTypeNormal,
		startingNumber,
		recreate,
	)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	respond := "A game has been started"
	if !started {
		respond = "There is already an ongoing game"
	}

	if channelId != ctx.Interaction.ChannelID {
		respond = fmt.Sprintf("%s in the <#%s> channel.", respond, channelId)
	} else {
		respond = respond + "."
	}

	err = utils.FollowUp(ctx, &discordgo.WebhookParams{
		Content: respond,
	}, true)
	if err != nil {
		utils.Logger.Error(err)
	}
}

func (m *GameModule) start(ctx *disgolf.Ctx) {
	m.startGame(ctx, false)
}

func (m *GameModule) reset(ctx *disgolf.Ctx) {
	m.startGame(ctx, true)
}

var options = []*discordgo.ApplicationCommandOption{
	{
		Type:        discordgo.ApplicationCommandOptionInteger,
		Name:        "starting-number",
		Description: "The number to start the game at",
		Required:    false,
	},
}

func (m *GameModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "game",
			Description: "Game command group",
			Middlewares: []disgolf.Handler{
				disgolf.HandlerFunc(middlewares.GuildModeratorMiddleware),
			},
			SubCommands: disgolf.NewRouter([]*disgolf.Command{
				{
					Name:        "start",
					Description: "Start a game when there is none ongoing.",
					Handler:     disgolf.HandlerFunc(m.start),
					Options:     options,
				},
				{
					Name:        "reset",
					Description: "Reset the current game and any points earned.",
					Handler:     disgolf.HandlerFunc(m.reset),
					Options:     options,
				},
			}),
		},
	}
}
