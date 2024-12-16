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

type SettingsChannelModule struct {
	container *di.Container
	settings  *services.SettingsService
}

func GetSettingsChannelModule(container *di.Container) *SettingsChannelModule {
	return &SettingsChannelModule{
		container: container,
		settings:  container.Get(static.DiSettings).(*services.SettingsService),
	}
}

func (m *SettingsChannelModule) set(ctx *disgolf.Ctx) {
	utils.Defer(ctx, true)

	channel := ctx.Options["channel"].ChannelValue(ctx.Session)
	settings, err := m.settings.GetByGuildId(ctx.Interaction.GuildID)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	_, err = m.settings.Update(
		settings.ID,
		db.Settings.ChannelID.Set(string(channel.ID)),
	)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	utils.FollowUp(ctx, &discordgo.WebhookParams{
		Content: fmt.Sprintf("I will run in <#%s> from now on.", channel.ID),
	}, true)
}

func (m *SettingsChannelModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "channel",
			Description: "Set the channel Kusari will run in",
			Handler:     disgolf.HandlerFunc(m.set),
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionChannel,
					Name:        "channel",
					Description: "The channel kusari will run in",
					Required:    true,
				},
			},
		},
	}
}
