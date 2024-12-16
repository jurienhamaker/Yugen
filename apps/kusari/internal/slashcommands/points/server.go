package slashcommands

import (
	"fmt"
	"strconv"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"github.com/zekroTJA/shinpuru/pkg/hammertime"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"

	"jurien.dev/yugen/kusari/internal/services"
	local "jurien.dev/yugen/kusari/internal/static"
)

type ServerModule struct {
	container *di.Container
	settings  *services.SettingsService
	game      *services.GameService
	bot       *disgolf.Bot
}

func GetServerModule(container *di.Container) *ServerModule {
	return &ServerModule{
		container: container,
		settings:  container.Get(static.DiSettings).(*services.SettingsService),
		game:      container.Get(local.DiGame).(*services.GameService),
		bot:       container.Get(static.DiBot).(*disgolf.Bot),
	}
}

func (m *ServerModule) err(ctx *disgolf.Ctx) {
	utils.FollowUp(ctx, &discordgo.WebhookParams{
		Content: "Sorry couldn't retrieve the server information...",
	}, true)
}

func (m *ServerModule) server(ctx *disgolf.Ctx) {
	utils.Defer(ctx, true)

	settings, err := m.settings.GetByGuildId(ctx.Interaction.GuildID)
	if err != nil {
		utils.Logger.Error(err)
		m.err(ctx)
		return
	}

	game, gameExists, err := m.game.GetCurrentGame(ctx.Interaction.GuildID)
	if err != nil {
		utils.Logger.Error(err)
		m.err(ctx)
		return
	}

	history, historyExists, err := m.game.GetLastHistory(game)
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

	self := m.bot.State.User

	footer, err := utils.CreateEmbedFooter(
		m.container.Get(static.DiBot).(*disgolf.Bot),
		&utils.CreateEmbedFooterParams{
			IsVote: false,
		},
	)
	if err != nil {
		utils.Logger.Error(err)
		return
	}

	embedColor := m.container.Get(static.DiEmbedColor).(int)

	onGoingGameText := "None"
	channelId, ok := settings.ChannelID()
	if gameExists && ok {
		onGoingGameText = fmt.Sprintf("at <#%s>", channelId)
	}

	highscoreDateText := ""
	highscoreDate, ok := settings.HighscoreDate()
	if ok {
		highscoreDateText = " - " + hammertime.Format(highscoreDate, hammertime.Span)
	}

	lastWordText := "-"
	if historyExists && history.UserID != self.ID {
		lastWordText = fmt.Sprintf("<@%s>", history.UserID)
	}

	embed := &discordgo.MessageEmbed{
		Color: embedColor,
		Title: guild.Name,
		Thumbnail: &discordgo.MessageEmbedThumbnail{
			URL: guild.IconURL("64"),
		},
		Description: fmt.Sprintf(
			`Ongoing game: **%s**
High score: **%d%s**
Last word: **%s**
Last word by: **%s**

Guild saves: **%s/%s**
Saves used: **%s**
				`,
			onGoingGameText,
			settings.Highscore,
			highscoreDateText,
			history.Word,
			lastWordText,
			strconv.FormatFloat(settings.Saves, 'f', -1, 64),
			strconv.FormatFloat(settings.MaxSaves, 'f', -1, 64),
			strconv.FormatFloat(settings.SavesUsed, 'f', -1, 64),
		),
		Footer: footer,
	}

	err = utils.FollowUp(ctx, &discordgo.WebhookParams{
		Embeds: []*discordgo.MessageEmbed{embed},
	}, true)
	if err != nil {
		utils.Logger.Error(err)
	}
}

func (m *ServerModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "server",
			Description: "Get the server information!",
			Handler:     disgolf.HandlerFunc(m.server),
		},
	}
}
