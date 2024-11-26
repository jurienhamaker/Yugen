package slashcommands

import (
	"fmt"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/middlewares"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"

	"jurien.dev/yugen/kazu/internal/services"
	local "jurien.dev/yugen/kazu/internal/static"
)

type ResetLeaderboardModule struct {
	container *di.Container
	bot       *disgolf.Bot
	points    *services.PointsService
}

func GetResetLeaderboardModule(container *di.Container) *ResetLeaderboardModule {
	return &ResetLeaderboardModule{
		container: container,
		bot:       container.Get(static.DiBot).(*disgolf.Bot),
		points:    container.Get(local.DiPoints).(*services.PointsService),
	}
}

func (m *ResetLeaderboardModule) err(ctx *disgolf.Ctx) {
	utils.Respond(ctx, &discordgo.InteractionResponseData{
		Content: "Something wen't wrong, try again later.",
	})
}

func (m *ResetLeaderboardModule) request(ctx *disgolf.Ctx) {
	footer, err := utils.CreateEmbedFooter(
		m.container.Get(static.DiBot).(*disgolf.Bot),
		&utils.CreateEmbedFooterParams{
			IsVote: false,
		},
	)
	if err != nil {
		utils.Logger.Error(err)
		m.err(ctx)
		return
	}

	guild, err := m.bot.Guild(ctx.Interaction.GuildID)
	if err != nil {
		utils.Logger.Error(err)
		m.err(ctx)
		return
	}

	embedColor := m.container.Get(static.DiEmbedColor).(int)

	embed := &discordgo.MessageEmbed{
		Color: embedColor,
		Title: "Reset leaderboard",
		Description: fmt.Sprintf(
			`Are you sure you want to reset the leaderboard of **%s**
**This action is irreversible**`,
			guild.Name,
		),
		Footer: footer,
	}

	err = utils.Respond(ctx, &discordgo.InteractionResponseData{
		Embeds: []*discordgo.MessageEmbed{embed},
		Components: []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.Button{
						CustomID: "RESET_LEADERBOARD/true",
						Style:    discordgo.DangerButton,
						Label:    "Reset leaderboard",
					},
					discordgo.Button{
						CustomID: "RESET_LEADERBOARD/false",
						Style:    discordgo.SecondaryButton,
						Label:    "Cancel",
					},
				},
			},
		},
	}, true)
	if err != nil {
		utils.Logger.Error(err)
	}
}

func (m *ResetLeaderboardModule) reset(ctx *disgolf.Ctx) {
	reset := ctx.MessageComponentOptions["reset"] == "true"

	if !reset {
		utils.Update(ctx, &discordgo.InteractionResponseData{
			Content:    "I have not reset the leaderboard",
			Components: []discordgo.MessageComponent{},
			Embeds:     []*discordgo.MessageEmbed{},
		})
		return
	}

	go m.points.ResetLeaderboardByGuildID(ctx.Interaction.GuildID)
	utils.Update(ctx, &discordgo.InteractionResponseData{
		Content:    "The leaderboard has been reset.",
		Components: []discordgo.MessageComponent{},
		Embeds:     []*discordgo.MessageEmbed{},
	})
}

func (m *ResetLeaderboardModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "reset-leaderboard",
			Description: "Reset all player points & completely reset the leaderboard.",
			Middlewares: []disgolf.Handler{
				disgolf.HandlerFunc(middlewares.GuildAdminMiddleware),
			},
			Handler: disgolf.HandlerFunc(m.request),
		},
	}
}

func (m *ResetLeaderboardModule) MessageComponents() []*disgolf.MessageComponent {
	return []*disgolf.MessageComponent{
		{
			CustomID: "RESET_LEADERBOARD/:reset",
			Middlewares: []disgolf.Handler{
				disgolf.HandlerFunc(middlewares.GuildAdminMiddleware),
			},
			Handler: disgolf.HandlerFunc(m.reset),
		},
	}
}
