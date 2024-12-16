package slashcommands

import (
	"fmt"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kusari/internal/services"
	"jurien.dev/yugen/kusari/prisma/db"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

type SettingsBotUpdatesModule struct {
	container *di.Container
	settings  *services.SettingsService
}

func GetSettingsBotUpdatesModule(container *di.Container) *SettingsBotUpdatesModule {
	return &SettingsBotUpdatesModule{
		container: container,
		settings:  container.Get(static.DiSettings).(*services.SettingsService),
	}
}

func (m *SettingsBotUpdatesModule) set(ctx *disgolf.Ctx) {
	utils.Defer(ctx, true)

	channel := ctx.Options["channel"].ChannelValue(ctx.Session)
	settings, err := m.settings.GetByGuildId(ctx.Interaction.GuildID)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	_, err = m.settings.Update(
		settings.ID,
		db.Settings.BotUpdatesChannelID.Set(string(channel.ID)),
	)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	utils.FollowUp(ctx, &discordgo.WebhookParams{
		Content: fmt.Sprintf("I will send my updates to <#%s> from now on.", channel.ID),
	}, true)
}

func (m *SettingsBotUpdatesModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "bot-updates",
			Description: "Set channel for the bot updates",
			Handler:     disgolf.HandlerFunc(m.set),
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionChannel,
					Name:        "channel",
					Description: "The channel to send updates to.",
					Required:    true,
				},
			},
		},
	}
}
