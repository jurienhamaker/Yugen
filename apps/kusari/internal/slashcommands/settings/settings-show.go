package slashcommands

import (
	"fmt"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kusari/internal/services"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

type SettingsShowModule struct {
	container *di.Container
	settings  *services.SettingsService

	SubCommands []*disgolf.Command
}

func GetSettingsShowModule(container *di.Container) *SettingsShowModule {
	return &SettingsShowModule{
		container: container,
		settings:  container.Get(static.DiSettings).(*services.SettingsService),
	}
}

func (m *SettingsShowModule) show(ctx *disgolf.Ctx) {
	utils.Defer(ctx, true)

	settings, err := m.settings.GetByGuildId(ctx.Interaction.GuildID)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	channelID, channelIDOk := settings.ChannelID()
	botUpdatesChannelID, botUpdatesChannelIDOk := settings.BotUpdatesChannelID()
	cooldown := settings.Cooldown

	channelIDText := "-"
	if channelIDOk {
		channelIDText = fmt.Sprintf("<#%s>", channelID)
	}

	botUpdatesChannelIDText := "-"
	if botUpdatesChannelIDOk {
		botUpdatesChannelIDText = fmt.Sprintf("<#%s>", botUpdatesChannelID)
	}

	cooldownText := fmt.Sprintf("%d minutes", cooldown)
	if cooldown == 1 {
		cooldownText = fmt.Sprintf("%d minute", cooldown)
	}
	if cooldown == 0 {
		cooldownText = "None"
	}

	footer, _ := utils.CreateEmbedFooter(
		m.container.Get(static.DiBot).(*disgolf.Bot),
		&utils.CreateEmbedFooterParams{
			IsVote: false,
		},
	)

	embed := &discordgo.MessageEmbed{
		Color:       m.container.Get(static.DiEmbedColor).(int),
		Title:       "Kusari settings",
		Description: "These are the settings currently configured for Kusari",
		Footer:      footer,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:   "Channel",
				Value:  channelIDText,
				Inline: true,
			},
			{
				Name:   "Bot updates channel",
				Value:  botUpdatesChannelIDText,
				Inline: true,
			},
			{
				Name:   "Answers cooldown",
				Value:  cooldownText,
				Inline: true,
			},
		},
	}

	utils.FollowUp(ctx, &discordgo.WebhookParams{
		Embeds: []*discordgo.MessageEmbed{embed},
	}, true)
}

func (m *SettingsShowModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "show",
			Description: "Show the current settings",
			Handler:     disgolf.HandlerFunc(m.show),
		},
	}
}
