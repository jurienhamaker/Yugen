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

type SettingsCooldownModule struct {
	container *di.Container
	settings  *services.SettingsService
}

func GetSettingsCooldownModule(container *di.Container) *SettingsCooldownModule {
	return &SettingsCooldownModule{
		container: container,
		settings:  container.Get(static.DiSettings).(*services.SettingsService),
	}
}

func (m *SettingsCooldownModule) set(ctx *disgolf.Ctx) {
	utils.Defer(ctx, true)

	utils.Logger.With("Options", ctx.Options["cooldown"], "GuildID", ctx.Interaction.GuildID).Info("Cooldown command used")

	cooldown := ctx.Options["cooldown"].IntValue()
	settings, err := m.settings.GetByGuildId(ctx.Interaction.GuildID)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	_, err = m.settings.Update(
		settings.ID,
		db.Settings.Cooldown.Set(int(cooldown)),
	)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	minutesText := "minutes"
	if cooldown == 1 {
		minutesText = "minute"
	}

	content := fmt.Sprintf("Members will now be able to provide a word every %d %s.", cooldown, minutesText)
	if cooldown == 0 {
		content = "Cooldown has been removed!"
	}

	utils.FollowUp(ctx, &discordgo.WebhookParams{
		Content: content,
	}, true)
}

func (m *SettingsCooldownModule) Commands() []*disgolf.Command {
	minValue := 0.0
	maxValue := 60.0

	return []*disgolf.Command{
		{
			Name:        "cooldown",
			Description: "Set the cooldown between answers.",
			Handler:     disgolf.HandlerFunc(m.set),
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionInteger,
					Name:        "cooldown",
					Description: "The amount of minutes between answers.",
					Required:    true,
					MinValue:    &minValue,
					MaxValue:    maxValue,
				},
			},
		},
	}
}
