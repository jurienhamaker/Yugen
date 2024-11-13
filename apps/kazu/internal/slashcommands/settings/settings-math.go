package slashcommands

import (
	"fmt"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kazu/internal/services"
	"jurien.dev/yugen/kazu/prisma/db"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

type SettingsMathModule struct {
	container *di.Container
	settings  *services.SettingsService
}

func GetSettingsMathModule(container *di.Container) *SettingsMathModule {
	return &SettingsMathModule{
		container: container,
		settings:  container.Get(static.DiSettings).(*services.SettingsService),
	}
}

func (m *SettingsMathModule) set(ctx *disgolf.Ctx) {
	utils.Defer(ctx, true)

	enabled := ctx.Options["enabled"].BoolValue()
	settings, err := m.settings.GetByGuildId(ctx.Interaction.GuildID)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	_, err = m.settings.Update(
		settings.ID,
		db.Settings.Math.Set(enabled),
	)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	valueText := "disabled"
	if enabled {
		valueText = "enabled"
	}

	utils.FollowUp(ctx, &discordgo.WebhookParams{
		Content: fmt.Sprintf("I **%s** math from being parsed.", valueText),
	}, true)
}

func (m *SettingsMathModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "math",
			Description: "Set wether Kazu will try to parse math.",
			Handler:     disgolf.HandlerFunc(m.set),
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionBoolean,
					Name:        "enabled",
					Description: "Wether Kazu will try to parse math.",
					Required:    true,
				},
			},
		},
	}
}
