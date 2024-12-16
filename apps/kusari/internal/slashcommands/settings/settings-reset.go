package slashcommands

import (
	"fmt"
	"slices"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kusari/internal/services"
	"jurien.dev/yugen/kusari/prisma/db"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

var choices = []*discordgo.ApplicationCommandOptionChoice{
	{
		Name:  "Channel",
		Value: "channelID",
	},
	{
		Name:  "Bot updates channel",
		Value: "botUpdatesChannelID",
	},
	{
		Name:  "Cooldown",
		Value: "cooldown",
	},
}

type SettingsResetModule struct {
	container *di.Container
	settings  *services.SettingsService
}

func GetSettingsResetModule(container *di.Container) *SettingsResetModule {
	return &SettingsResetModule{
		container: container,
		settings:  container.Get(static.DiSettings).(*services.SettingsService),
	}
}

func (m *SettingsResetModule) set(ctx *disgolf.Ctx) {
	utils.Defer(ctx, true)

	setting := ctx.Options["setting"].StringValue()
	settings, err := m.settings.GetByGuildId(ctx.Interaction.GuildID)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	var dbSetting db.SettingsSetParam
	var value string
	switch setting {
	case "channelID":
		dbSetting = db.Settings.ChannelID.SetOptional(nil)
		value = "unset"
	case "botUpdatesChannelID":
		dbSetting = db.Settings.BotUpdatesChannelID.SetOptional(nil)
		value = "unset"
	case "cooldown":
		dbSetting = db.Settings.Cooldown.Set(0)
		value = "0"
	}

	if dbSetting == nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	_, err = m.settings.Update(
		settings.ID,
		dbSetting,
	)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	choiceIdx := slices.IndexFunc(
		choices,
		func(choice *discordgo.ApplicationCommandOptionChoice) bool { return choice.Value == setting },
	)
	name := choices[choiceIdx].Name

	utils.FollowUp(ctx, &discordgo.WebhookParams{
		Content: fmt.Sprintf("%s has been reset to it's default value of `%s`", name, value),
	}, true)
}

func (m *SettingsResetModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "reset",
			Description: "Reset a Kusari setting to it's default value.",
			Handler:     disgolf.HandlerFunc(m.set),
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionString,
					Name:        "setting",
					Description: "The setting to reset to it's default value.",
					Required:    true,
					Choices:     choices,
				},
			},
		},
	}
}
