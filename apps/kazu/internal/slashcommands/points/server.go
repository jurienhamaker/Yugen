package slashcommands

import (
	"fmt"
	"strconv"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"github.com/zekroTJA/shinpuru/pkg/hammertime"
	"github.com/zekrotja/dgrs"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"

	"jurien.dev/yugen/kazu/internal/services"
	local "jurien.dev/yugen/kazu/internal/static"
)

type ServerModule struct {
	container *di.Container
	settings  *services.SettingsService
	game      *services.GameService
	state     *dgrs.State
}

func GetServerModule(container *di.Container) *ServerModule {
	return &ServerModule{
		container: container,
		settings:  container.Get(static.DiSettings).(*services.SettingsService),
		game:      container.Get(local.DiGame).(*services.GameService),
		state:     container.Get(static.DiState).(*dgrs.State),
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

	guild, err := m.state.Guild(ctx.Interaction.GuildID, false)
	if err != nil {
		utils.Logger.Error(err)
		m.err(ctx)
		return
	}

	self, err := m.state.SelfUser()
	if err != nil {
		utils.Logger.Error(err)
		m.err(ctx)
		return
	}

	footer, err := utils.CreateEmbedFooter(
		m.container.Get(static.DiBot).(*disgolf.Bot),
		m.container.Get(static.DiState).(*dgrs.State),
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

	lastCountedText := "-"
	if historyExists && history.UserID != self.ID {
		lastCountedText = fmt.Sprintf("<@%s>", history.UserID)
	}

	lastShamedText := "\n"
	_, ok = settings.ShameRoleID()
	if ok {
		lastShameUserID, ok := settings.LastShameUserID()
		userText := "-"
		if ok {
			userText = fmt.Sprintf("<@%s>", lastShameUserID)
		}

		lastShamedText = fmt.Sprintf("Last shamed user: **%s**\n", userText)
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
Last number: **%d**
Last count by: **%s**
%s
Guild saves: **%s/%s**
Saves used: **%s**
				`,
			onGoingGameText,
			settings.Highscore,
			highscoreDateText,
			history.Number,
			lastCountedText,
			lastShamedText,
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
