package slashcommands

import (
	"fmt"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/middlewares"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"

	"jurien.dev/yugen/kusari/internal/services"
	local "jurien.dev/yugen/kusari/internal/static"
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

	memberOption := ctx.Options["member"]
	userID := "none"
	confirmationTarget := guild.Name

	if memberOption != nil {
		userID = memberOption.Value.(string)
		confirmationTarget = fmt.Sprintf("<@%s>", userID)

	}

	embed := &discordgo.MessageEmbed{
		Color: embedColor,
		Title: "Reset leaderboard",
		Description: fmt.Sprintf(
			`Are you sure you want to reset the leaderboard of **%s**
**This action is irreversible**`,
			confirmationTarget,
		),
		Footer: footer,
	}

	err = utils.Respond(ctx, &discordgo.InteractionResponseData{
		Embeds: []*discordgo.MessageEmbed{embed},
		Components: []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.Button{
						CustomID: fmt.Sprintf("RESET_LEADERBOARD/true/%s", userID),
						Style:    discordgo.DangerButton,
						Label:    "Reset leaderboard",
					},
					discordgo.Button{
						CustomID: fmt.Sprintf("RESET_LEADERBOARD/false/%s", userID),
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
		contentText := "I have not reset the leaderboard"
		if ctx.MessageComponentOptions["userID"] != "none" {
			contentText = fmt.Sprintf("%s for <@%s>", contentText, ctx.MessageComponentOptions["userID"])
		}

		utils.Update(ctx, &discordgo.InteractionResponseData{
			Content:    contentText,
			Components: []discordgo.MessageComponent{},
			Embeds:     []*discordgo.MessageEmbed{},
		})
		return
	}

	contentText := "The leaderboard points have been reset"
	if ctx.MessageComponentOptions["userID"] != "none" {
		contentText = fmt.Sprintf("%s for <@%s>", contentText, ctx.MessageComponentOptions["userID"])
		go m.points.ResetLeaderboardByGuildIDAndUserID(ctx.Interaction.GuildID, ctx.MessageComponentOptions["userID"])
	} else {
		go m.points.ResetLeaderboardByGuildID(ctx.Interaction.GuildID)
	}

	utils.Update(ctx, &discordgo.InteractionResponseData{
		Content:    contentText,
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
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionUser,
					Name:        "member",
					Description: "The member to reset from the leaderboard.",
					Required:    false,
				},
			},
		},
	}
}

func (m *ResetLeaderboardModule) MessageComponents() []*disgolf.MessageComponent {
	return []*disgolf.MessageComponent{
		{
			CustomID: "RESET_LEADERBOARD/:reset/:userID",
			Middlewares: []disgolf.Handler{
				disgolf.HandlerFunc(middlewares.GuildAdminMiddleware),
			},
			Handler: disgolf.HandlerFunc(m.reset),
		},
	}
}
