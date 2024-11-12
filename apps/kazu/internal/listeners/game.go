package listeners

import (
	"fmt"
	"log"

	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kazu/internal/services"
	localStatic "jurien.dev/yugen/kazu/internal/static"
	"jurien.dev/yugen/kazu/prisma/db"
	"jurien.dev/yugen/shared/static"
)

type GameListener struct {
	database *db.PrismaClient
	settings *services.SettingsService
	service  *services.GameService
}

func GetGameListener(container *di.Container) *GameListener {
	log.Println("Creating Color Listener")
	return &GameListener{
		database: container.Get(static.DiDatabase).(*db.PrismaClient),
		settings: container.Get(static.DiSettings).(*services.SettingsService),
		service:  container.Get(localStatic.DiGame).(*services.GameService),
	}
}

func AddGameListeners(container *di.Container) {
	session := container.Get(static.DiDiscordSession).(*discordgo.Session)

	colorListener := GetGameListener(container)
	session.AddHandler(colorListener.MessageCreateHandler)
	session.AddHandler(colorListener.MessageUpdateHandler)
	session.AddHandler(colorListener.MessageDeleteHandler)
}

func (listener *GameListener) MessageCreateHandler(session *discordgo.Session, event *discordgo.MessageCreate) {
	ok, settings := listener.getSettings(event.GuildID, event.ChannelID)
	if !ok {
		return
	}

	number, err := listener.service.ParseNumber(event.Message, settings.Math)
	if err != nil {
		return
	}

	listener.service.AddNumber(event.GuildID, number, event.Message, settings)
}

func (listener *GameListener) MessageUpdateHandler(session *discordgo.Session, event *discordgo.MessageUpdate) {
	ok, settings := listener.getSettings(event.GuildID, event.ChannelID)
	if !ok {
		return
	}

	isEqual, number := listener.service.IsEqualToLast(event.Message, settings, false)
	if isEqual {
		return
	}

	go session.ChannelMessageSend(
		event.ChannelID,
		fmt.Sprintf(`<@%s> just edited their guess 😒
Last number was **%d**!`, event.Author.ID, number),
	)
}

func (listener *GameListener) MessageDeleteHandler(session *discordgo.Session, event *discordgo.MessageDelete) {
	ok, settings := listener.getSettings(event.GuildID, event.ChannelID)
	if !ok {
		return
	}

	isEqual, number := listener.service.IsEqualToLast(event.BeforeDelete, settings, true)
	if isEqual {
		return
	}

	go session.ChannelMessageSend(
		event.ChannelID,
		fmt.Sprintf(`<@%s> just deleted their number 😒 
Last number was **%d**!`, event.BeforeDelete.Author.ID, number),
	)
}

func (listener *GameListener) getSettings(guildID string, channelID string) (ok bool, settings *db.SettingsModel) {
	ok = false

	settings, err := listener.settings.GetByGuildId(guildID)
	if err != nil {
		log.Println("Failed to get settings", err)
		return
	}

	settingsChannelID, ok := settings.ChannelID()
	if !ok || channelID != settingsChannelID {
		ok = false
	}

	return
}
