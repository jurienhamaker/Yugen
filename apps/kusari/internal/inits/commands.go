package inits

import (
	"github.com/FedorLap2006/disgolf"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/slashcommands"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"

	game "jurien.dev/yugen/kusari/internal/slashcommands/game"
	points "jurien.dev/yugen/kusari/internal/slashcommands/points"
	settings "jurien.dev/yugen/kusari/internal/slashcommands/settings"
)

func InitCommands(container *di.Container) (err error) {
	bot := container.Get(static.DiBot).(*disgolf.Bot)

	modules := []utils.CommandsModule{
		// shared
		slashcommands.GetVoteModule(container),
		slashcommands.GetDonateModule(container),
		slashcommands.GetSupportModule(container),
		slashcommands.GetInviteModule(container),

		slashcommands.GetHelpModule(container),
		slashcommands.GetTutorialModule(container),

		// internal
		game.GetGameModule(container),

		settings.GetSettingsModule(container),

		points.GetDonateSaveModule(container),
		points.GetProfileModule(container),
		points.GetServerModule(container),

		points.GetResetLeaderboardModule(container),
		points.GetLeaderboardModule(container),
	}

	utils.RegisterCommandModules(bot, modules)

	bot.AddHandler(bot.Router.HandleInteraction)
	bot.AddHandler(bot.Router.HandleInteractionMessageComponent)

	err = utils.SyncCommands(bot, len(modules))

	return
}
