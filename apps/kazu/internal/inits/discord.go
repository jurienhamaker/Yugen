package inits

import (
	"log"
	"os"

	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kazu/internal/listeners"
	"jurien.dev/yugen/shared/static"
)

const (
	Intents = discordgo.IntentsGuilds |
		discordgo.IntentsGuildMessages |
		discordgo.IntentsGuildVoiceStates |
		discordgo.IntentsMessageContent |
		discordgo.IntentsGuildEmojis |
		discordgo.IntentsGuildMessageReactions
)

func InitDiscordSession(container *di.Container) (release func()) {
	release = func() {}

	session := container.Get(static.DiDiscordSession).(*discordgo.Session)

	session.Token = "Bot " + os.Getenv(static.EnvDiscordToken)
	session.Identify.Intents = Intents

	session.State.MaxMessageCount = 100

	session.AddHandler(func(session *discordgo.Session, event *discordgo.Ready) {
		log.Printf("Logged in as: %v#%v", session.State.User.Username, session.State.User.Discriminator)
	})

	listeners.AddGameListeners(container)

	err := session.Open()
	if err != nil {
		log.Panic(err)
	}

	return
}
