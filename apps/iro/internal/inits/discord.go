package inits

import (
	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/iro/internal/listeners"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
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

func InitDiscordBot(container *di.Container) (release func()) {
	release = func() {}

	bot := container.Get(static.DiBot).(*disgolf.Bot)

	bot.Identify.Intents = Intents

	bot.AddHandler(func(bot *discordgo.Session, event *discordgo.Ready) {
		utils.Logger.Infof("Logged in as: %v#%v", bot.State.User.Username, bot.State.User.Discriminator)
	})

	listeners.AddColorListeners(container)

	err := bot.Open()
	if err != nil {
		utils.Logger.Panic(err)
	}

	return
}
