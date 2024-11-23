package listeners

import (
	"log"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

func AddLogListeners(container *di.Container) {
	bot := container.Get(static.DiBot).(*disgolf.Bot)

	bot.AddHandler(func(bot *discordgo.Session, event *discordgo.InteractionCreate) {
		if event.Type != discordgo.InteractionApplicationCommand {
			return
		}

		data := event.ApplicationCommandData()
		name := utils.GetInteractionName(&data)
		log.Printf("Interaction \"%s\" used by %s", name, event.Member.User.Username)
	})

	bot.AddHandler(func(bot *discordgo.Session, event *discordgo.InteractionCreate) {
		if event.Type != discordgo.InteractionMessageComponent {
			return
		}

		data := event.MessageComponentData()
		log.Printf("Message component \"%s\" used by %s", data.CustomID, event.Member.User.Username)
	})
}
