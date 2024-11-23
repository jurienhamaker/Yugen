package listeners

import (
	"fmt"
	"os"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"github.com/zekrotja/dgrs"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

func sendLogMessage(container *di.Container, event *discordgo.InteractionCreate, data *discordgo.ApplicationCommandInteractionData) {
	bot := container.Get(static.DiBot).(*disgolf.Bot)
	state := container.Get(static.DiState).(*dgrs.State)

	name := utils.GetInteractionName(data, " ")

	guild, err := state.Guild(event.GuildID)
	if err != nil {
		utils.Logger.Error(err)
		return
	}

	message := fmt.Sprintf("Interaction **%s** used by **%s** (%s) in **%s** (%s)", name, event.Member.User.Username, event.Member.User.ID, guild.Name, guild.ID)
	channelID := os.Getenv(static.EnvDiscordLogsReportChannelID)
	bot.ChannelMessageSend(channelID, message)
}

func AddLogListeners(container *di.Container) {
	bot := container.Get(static.DiBot).(*disgolf.Bot)

	bot.AddHandler(func(bot *discordgo.Session, event *discordgo.InteractionCreate) {
		if event.Type != discordgo.InteractionApplicationCommand {
			return
		}

		data := event.ApplicationCommandData()
		name := utils.GetInteractionName(&data)
		utils.Logger.With(
			"interaction", name,
			"username", event.Member.User.Username,
			"userID", event.Member.User.ID,
			"guildID", event.GuildID,
		).Infof("Interaction \"%s\" used by %s", name, event.Member.User.Username)

		go sendLogMessage(container, event, &data)
	})

	bot.AddHandler(func(bot *discordgo.Session, event *discordgo.InteractionCreate) {
		if event.Type != discordgo.InteractionMessageComponent {
			return
		}

		data := event.MessageComponentData()

		utils.Logger.With(
			"customID", data.CustomID,
			"username", event.Member.User.Username,
			"userID", event.Member.User.ID,
			"guildID", event.GuildID,
		).Infof("Message component \"%s\" used by %s", data.CustomID, event.Member.User.Username)
	})
}
