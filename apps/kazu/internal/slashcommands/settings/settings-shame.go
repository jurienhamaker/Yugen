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

type SettingsShameModule struct {
	container *di.Container
	settings  *services.SettingsService
}

func GetSettingsShameModule(container *di.Container) *SettingsShameModule {
	return &SettingsShameModule{
		container: container,
		settings:  container.Get(static.DiSettings).(*services.SettingsService),
	}
}

func (m *SettingsShameModule) setRole(ctx *disgolf.Ctx) {
	utils.Defer(ctx, true)

	role := ctx.Options["role"].RoleValue(ctx.Session, ctx.Interaction.GuildID)
	settings, err := m.settings.GetByGuildId(ctx.Interaction.GuildID)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	_, err = m.settings.Update(
		settings.ID,
		db.Settings.ShameRoleID.Set(role.ID),
	)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	utils.FollowUp(ctx, &discordgo.WebhookParams{
		Content: fmt.Sprintf("I will apply <@&%s> to the person that breaks the count chain.", role.ID),
	}, true)
}

func (m *SettingsShameModule) setRemoveShameRole(ctx *disgolf.Ctx) {
	utils.Defer(ctx, true)

	remove := ctx.Options["remove"].BoolValue()
	settings, err := m.settings.GetByGuildId(ctx.Interaction.GuildID)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	_, err = m.settings.Update(
		settings.ID,
		db.Settings.RemoveShameRoleAfterHighscore.Set(remove),
	)
	if err != nil {
		utils.ErrorResponse(ctx, true)
		return
	}

	valueText := "remove"
	if !remove {
		valueText = "not " + valueText
	}

	utils.FollowUp(ctx, &discordgo.WebhookParams{
		Content: fmt.Sprintf("I will **%s** the shame role  after a highscore is reached.", valueText),
	}, true)
}

func (m *SettingsShameModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "shame-role",
			Description: "Set shame role Kazu will apply on failure.",
			Handler:     disgolf.HandlerFunc(m.setRole),
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionRole,
					Name:        "role",
					Description: "The role Kazu will apply on failure.",
					Required:    true,
				},
			},
		},
		{
			Name:        "remove-shame-role-on-highscore",
			Description: "Set wether Kazu will reset the shame role after a highscore is reached.",
			Handler:     disgolf.HandlerFunc(m.setRemoveShameRole),
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionBoolean,
					Name:        "remove",
					Description: "Wether Kazu will remove the shame role when a highscore is reached.",
					Required:    true,
				},
			},
		},
	}
}
