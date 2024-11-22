package inits

import (
	"log"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kazu/internal/listeners"
	"jurien.dev/yugen/shared/static"

	sharedListeners "jurien.dev/yugen/shared/listeners"
)

const (
	Intents = discordgo.IntentsGuilds |
		discordgo.IntentsGuildMessages |
		discordgo.IntentsGuildVoiceStates |
		discordgo.IntentsMessageContent |
		discordgo.IntentsGuildEmojis |
		discordgo.IntentsGuildMessageReactions
)

func InitDiscordBot(container *di.Container) (release func()) {
	release = func() {}

	bot := container.Get(static.DiBot).(*disgolf.Bot)

	bot.Identify.Intents = Intents

	bot.State.MaxMessageCount = 100

	bot.AddHandler(func(bot *discordgo.Session, event *discordgo.Ready) {
		log.Printf("Logged in as: %v#%v", bot.State.User.Username, bot.State.User.Discriminator)
	})

	// shared
	sharedListeners.AddLogListeners(container)

	// internal
	listeners.AddGameListeners(container)

	err := InitCommands(container)
	if err != nil {
		log.Panic(err)
	}

	err = bot.Open()
	if err != nil {
		log.Panic(err)
	}

	return
}
