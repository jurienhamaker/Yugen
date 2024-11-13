package inits

import (
	"log"
	"os"

	"github.com/FedorLap2006/disgolf"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/slashcommands"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"

	game "jurien.dev/yugen/kazu/internal/slashcommands/game"
	settings "jurien.dev/yugen/kazu/internal/slashcommands/settings"
)

func InitCommands(container *di.Container) (err error) {
	bot := container.Get(static.DiBot).(*disgolf.Bot)

	modules := []utils.CommandsModule{
		// shared
		slashcommands.GetVoteModule(container),

		// internal
		game.GetGameModule(container),
		settings.GetSettingsModule(container),
	}

	os.Getenv(static.EnvDiscordAppID)
	utils.RegisterCommandModules(bot, modules)

	bot.AddHandler(bot.Router.HandleInteraction)

	if os.Getenv(static.EnvSyncCommands) == "true" {
		log.Printf("Syncing commands of %d modules", len(modules))
		err = bot.Router.Sync(bot.Session, os.Getenv(static.EnvDiscordAppID), os.Getenv(static.EnvDiscordDevelopmentGuildID))
	}
	return
}
