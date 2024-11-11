package inits

import (
	"log"
	"os"

	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/iro/internal/listeners"
	"jurien.dev/yugen/shared/static"
)

const (
	Intents = discordgo.IntentsDirectMessages |
		discordgo.IntentsGuildBans |
		discordgo.IntentsGuildEmojis |
		discordgo.IntentsGuildIntegrations |
		discordgo.IntentsGuildInvites |
		discordgo.IntentsGuildMembers |
		discordgo.IntentsGuildMessageReactions |
		discordgo.IntentsGuildMessages |
		// discordgo.IntentsGuildPresences |
		discordgo.IntentsGuildVoiceStates |
		discordgo.IntentsGuilds |
		discordgo.IntentsGuildVoiceStates
)

func InitDiscordSession(container *di.Container) (release func()) {
	release = func() {}

	session := container.Get(static.DiDiscordSession).(*discordgo.Session)

	session.Token = "Bot " + os.Getenv(static.EnvDiscordToken)

	session.Identify.Intents = Intents

	session.AddHandler(func(session *discordgo.Session, event *discordgo.Ready) {
		log.Printf("Logged in as: %v#%v", session.State.User.Username, session.State.User.Discriminator)
	})

	listeners.AddColorListeners(container)

	err := session.Open()
	if err != nil {
		log.Panic(err)
	}

	return
}
