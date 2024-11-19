package slashcommands

import (
	"fmt"
	"strconv"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/utils"

	"jurien.dev/yugen/kazu/internal/services"
	local "jurien.dev/yugen/kazu/internal/static"
)

type ProfileModule struct {
	container *di.Container
	saves     *services.SavesService
	points    *services.PointsService
}

func GetProfileModule(container *di.Container) *ProfileModule {
	return &ProfileModule{
		container: container,
		saves:     container.Get(local.DiSaves).(*services.SavesService),
		points:    container.Get(local.DiPoints).(*services.PointsService),
	}
}

func (m *ProfileModule) profile(ctx *disgolf.Ctx) {
	utils.Defer(ctx, true)

	saves, err := m.saves.GetPlayerSavesByUserID(ctx.Interaction.Member.User.ID)
	if err != nil {
		utils.FollowUp(ctx, &discordgo.WebhookParams{
			Content: "Sorry couldn't find your profile...",
		}, true)
		return
	}

	points, err := m.points.GetPlayer(ctx.Interaction.GuildID, ctx.Interaction.Member.User.ID, true)
	if err != nil {
		utils.FollowUp(ctx, &discordgo.WebhookParams{
			Content: "Sorry couldn't find your profile...",
		}, true)
		return
	}

	utils.FollowUp(ctx, &discordgo.WebhookParams{
		Content: fmt.Sprintf(
			`You currently have **%d** points!
And you have **%s/2** saves available!`,
			points.Points,
			strconv.FormatFloat(saves.Saves, 'f', -1, 64),
		),
	}, true)
}

func (m *ProfileModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "profile",
			Description: "Get your kazu profile!",
			Handler:     disgolf.HandlerFunc(m.profile),
		},
		{
			Name:        "points",
			Description: "[Deprecated] Get your current points!",
			Handler:     disgolf.HandlerFunc(m.profile),
		},
	}
}
