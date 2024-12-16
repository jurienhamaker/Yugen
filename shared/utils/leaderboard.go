package utils

import (
	"fmt"
	"math"
	"strconv"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/static"
)

type leaderboardSourceType string

const (
	LEADERBOARD_INTERACTION       leaderboardSourceType = "interaction"
	LEADERBOARD_MESSAGE_COMPONENT leaderboardSourceType = "message_component"
)

type (
	LeaderboardDataFunc   func(ctx *disgolf.Ctx, page int) ([]any, int, error)
	LeaderboardFormatFunc func(ctx *disgolf.Ctx, item any) string
)

func GetLeaderboardCommands(handler disgolf.HandlerFunc) []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "leaderboard",
			Description: "Get the current servers leaderboard!",
			Handler:     handler,
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionInteger,
					Name:        "page",
					Description: "View a specific page.",
					Required:    false,
				},
			},
		},
	}
}

func GetLeaderboardMessageComponents(handler disgolf.HandlerFunc) []*disgolf.MessageComponent {
	return []*disgolf.MessageComponent{
		{
			CustomID: "LEADERBOARD/:page",
			Handler:  handler,
		},
	}
}

func LeaderboardCommandHandler(ctx *disgolf.Ctx, container *di.Container, getItems LeaderboardDataFunc, formatter LeaderboardFormatFunc) {
	page := 1

	pageOption := ctx.Options["page"]
	if pageOption != nil {
		page = int(pageOption.IntValue())
	}

	ShowLeaderboard(ctx, container, LEADERBOARD_INTERACTION, page, getItems, formatter)
}

func LeaderboardMessageComponentHandler(ctx *disgolf.Ctx, container *di.Container, getItems LeaderboardDataFunc, formatter LeaderboardFormatFunc) {
	page, err := strconv.Atoi(ctx.MessageComponentOptions["page"])
	if err != nil {
		return
	}

	ShowLeaderboard(ctx, container, LEADERBOARD_MESSAGE_COMPONENT, page, getItems, formatter)
}

func ShowLeaderboard(ctx *disgolf.Ctx, container *di.Container, source leaderboardSourceType, page int, getItems LeaderboardDataFunc, formatter LeaderboardFormatFunc) {
	if source == LEADERBOARD_INTERACTION {
		Defer(ctx, true)
	}

	items, total, err := getItems(ctx, page)
	if err != nil {
		Logger.Error(err)
		if source == LEADERBOARD_INTERACTION {
			InteractionError(ctx, true)
		}

		if source == LEADERBOARD_MESSAGE_COMPONENT {
			MessageComponentError(ctx)
		}
		return
	}

	errStr := ""
	if total == 0 {
		errStr = "There is no leaderboard available yet for this server."
	}

	if len(items) == 0 {
		errStr = fmt.Sprintf("No players found for page %d", page)
	}

	if len(errStr) > 0 {
		if source == LEADERBOARD_INTERACTION {
			FollowUp(ctx, &discordgo.WebhookParams{
				Content:    errStr,
				Embeds:     []*discordgo.MessageEmbed{},
				Components: []discordgo.MessageComponent{},
			})
		}

		if source == LEADERBOARD_MESSAGE_COMPONENT {
			Update(ctx, &discordgo.InteractionResponseData{
				Content:    errStr,
				Embeds:     []*discordgo.MessageEmbed{},
				Components: []discordgo.MessageComponent{},
			})
		}

		return
	}

	doLeaderboardResponse(ctx, container, source, page, total, items, formatter)
}

func doLeaderboardResponse(ctx *disgolf.Ctx, container *di.Container, source leaderboardSourceType, page int, total int, items []interface{}, formatter LeaderboardFormatFunc) {
	embedColor := container.Get(static.DiEmbedColor).(int)

	maxPage := int(math.Ceil(float64(total) / 10))

	footerParams := CreateEmbedFooterParams{
		IsVote: false,
	}

	if maxPage > 1 {
		footerParams.Text = fmt.Sprintf("Page %d/%d", page, maxPage)
	}

	footer, err := CreateEmbedFooter(
		container.Get(static.DiBot).(*disgolf.Bot),
		&footerParams,
	)
	if err != nil {
		Logger.Error(err)
		doError(ctx, source)
		return
	}

	bot := container.Get(static.DiBot).(*disgolf.Bot)
	guild, err := bot.Guild(ctx.Interaction.GuildID)
	if err != nil {
		Logger.Error(err)
		doError(ctx, source)
		return
	}

	description := ""
	for i, item := range items {
		description = fmt.Sprintf("%s\n%d. %s", description, i, formatter(ctx, item))
	}

	embed := &discordgo.MessageEmbed{
		Color:       embedColor,
		Title:       fmt.Sprintf("Points leaderboard for %s", guild.Name),
		Description: description,
		Thumbnail: &discordgo.MessageEmbedThumbnail{
			URL: guild.IconURL("128"),
		},
		Footer: footer,
	}

	components := []discordgo.MessageComponent{}
	if page > 1 {
		components = append(components, discordgo.Button{
			CustomID: fmt.Sprintf("LEADERBOARD/%d", page-1),
			Style:    discordgo.PrimaryButton,
			Label:    "◀️",
		})
	}

	if page < maxPage {
		components = append(components, discordgo.Button{
			CustomID: fmt.Sprintf("LEADERBOARD/%d", page+1),
			Style:    discordgo.PrimaryButton,
			Label:    "▶️",
		})
	}

	messageComponents := []discordgo.MessageComponent{}
	if len(components) > 0 {
		messageComponents = append(messageComponents, discordgo.ActionsRow{
			Components: components,
		})
	}

	if source == LEADERBOARD_MESSAGE_COMPONENT {
		err = Update(ctx, &discordgo.InteractionResponseData{
			Content:    "",
			Embeds:     []*discordgo.MessageEmbed{embed},
			Components: messageComponents,
		})
		if err != nil {
			Logger.Error(err)
		}
		return
	}

	err = FollowUp(ctx, &discordgo.WebhookParams{
		Content:    "",
		Embeds:     []*discordgo.MessageEmbed{embed},
		Components: messageComponents,
	})
	if err != nil {
		Logger.Error(err)
	}
}

func doError(ctx *disgolf.Ctx, source leaderboardSourceType) {
	if source == LEADERBOARD_INTERACTION {
		InteractionError(ctx, true)
	}

	if source == LEADERBOARD_MESSAGE_COMPONENT {
		MessageComponentError(ctx)
	}
}
