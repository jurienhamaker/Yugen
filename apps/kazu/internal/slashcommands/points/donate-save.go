package slashcommands

import (
	"fmt"
	"strconv"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"

	"jurien.dev/yugen/kazu/internal/services"
	local "jurien.dev/yugen/kazu/internal/static"
)

type DonateSaveModule struct {
	container *di.Container
	settings  *services.SettingsService
	saves     *services.SavesService
}

func GetDonateSaveModule(container *di.Container) *DonateSaveModule {
	return &DonateSaveModule{
		container: container,
		settings:  container.Get(static.DiSettings).(*services.SettingsService),
		saves:     container.Get(local.DiSaves).(*services.SavesService),
	}
}

func (m *DonateSaveModule) donateSave(ctx *disgolf.Ctx) {
	err := utils.Defer(ctx, true)
	if err != nil {
		return
	}

	player, err := m.saves.GetPlayerSavesByUserID(ctx.Interaction.Member.User.ID)
	if err != nil {
		return
	}

	settings, err := m.settings.GetByGuildId(ctx.Interaction.GuildID)
	if err != nil {
		return
	}

	if player.Saves < 1 {
		utils.FollowUp(ctx, &discordgo.WebhookParams{
			Content: fmt.Sprintf("You currently don't have atleast 1 save to donate, you currently have **%d** saves!", int(player.Saves)),
		}, true)
		return
	}

	if settings.Saves >= settings.MaxSaves {
		utils.FollowUp(ctx, &discordgo.WebhookParams{
			Content: fmt.Sprintf(
				"The server already has **%s/%s** saves!",
				strconv.FormatFloat(settings.Saves, 'f', -1, 64),
				strconv.FormatFloat(settings.MaxSaves, 'f', -1, 64),
			),
		}, true)
		return
	}

	go m.saves.DeductSaveFromPlayer(ctx.Interaction.Member.User.ID, 1)
	saves, maxSaves, err := m.saves.AddSaveToGuild(settings.GuildID, settings, 0.2)
	if err != nil {
		return
	}

	utils.FollowUp(ctx, &discordgo.WebhookParams{
		Content: fmt.Sprintf(
			`**Save donated!**
The server now has **%s/%s** saves!`,
			strconv.FormatFloat(saves, 'f', -1, 64),
			strconv.FormatFloat(maxSaves, 'f', -1, 64),
		),
	}, true)
}

func (m *DonateSaveModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "donate-save",
			Description: "Donate a personal save to the server.",
			Handler:     disgolf.HandlerFunc(m.donateSave),
		},
	}
}
