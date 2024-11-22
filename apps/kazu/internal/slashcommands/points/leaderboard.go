package slashcommands

import (
	"fmt"

	"github.com/FedorLap2006/disgolf"
	"github.com/sarulabs/di/v2"
	"github.com/zekrotja/dgrs"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"

	"jurien.dev/yugen/kazu/internal/services"
	local "jurien.dev/yugen/kazu/internal/static"
	"jurien.dev/yugen/kazu/prisma/db"
)

type LeaderboardModule struct {
	container *di.Container
	points    *services.PointsService
	state     *dgrs.State
}

func GetLeaderboardModule(container *di.Container) *LeaderboardModule {
	return &LeaderboardModule{
		container: container,
		points:    container.Get(local.DiPoints).(*services.PointsService),
		state:     container.Get(static.DiState).(*dgrs.State),
	}
}

func (m *LeaderboardModule) getItems(ctx *disgolf.Ctx, page int) ([]any, int, error) {
	items, total, err := m.points.GetLeaderboardByGuildID(ctx.Interaction.GuildID, page)
	return utils.UnpackArray(items), total, err
}

func (m *LeaderboardModule) formatItem(_ *disgolf.Ctx, item any) string {
	parsed := item.(db.PlayerStatsModel)
	return fmt.Sprintf("<@%s>: **%d**", parsed.UserID, parsed.Points)
}

func (m *LeaderboardModule) command(ctx *disgolf.Ctx) {
	utils.LeaderboardCommandHandler(
		ctx,
		m.container,
		m.state,
		m.getItems,
		m.formatItem,
	)
}

func (m *LeaderboardModule) messageComponent(ctx *disgolf.Ctx) {
	utils.LeaderboardMessageComponentHandler(
		ctx,
		m.container,
		m.state,
		m.getItems,
		m.formatItem,
	)
}

func (m *LeaderboardModule) Commands() []*disgolf.Command {
	return utils.GetLeaderboardCommands(disgolf.HandlerFunc(m.command))
}

func (m *LeaderboardModule) MessageComponents() []*disgolf.MessageComponent {
	return utils.GetLeaderboardMessageComponents(disgolf.HandlerFunc(m.messageComponent))
}
