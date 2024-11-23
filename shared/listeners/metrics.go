package listeners

import (
	"time"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/robfig/cron/v3"
	"github.com/sarulabs/di/v2"
	"github.com/zekrotja/dgrs"
	"jurien.dev/yugen/shared/metrics"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

func setLatency(bot *disgolf.Bot) {
	latency := bot.HeartbeatLatency()
	metrics.DiscordLatency.Set(float64(latency.Milliseconds()))
}

func reloadGuilds(state *dgrs.State) {
	time.Sleep(time.Second)
	guilds, err := state.Guilds()
	guildsLen := 0
	if err == nil {
		guildsLen = len(guilds)
	}

	metrics.TotalGuilds.Set(float64(guildsLen))
}

func reloadChannels(state *dgrs.State) {
	time.Sleep(time.Second)
	channels, err := state.Channels("")
	channelsLen := 0
	if err == nil {
		channelsLen = len(channels)
	}

	metrics.TotalChannels.Set(float64(channelsLen))
}

func reloadInteractions(bot *disgolf.Bot) {
	time.Sleep(time.Second)
	interactionsLen := 0
	for _, command := range bot.Router.Commands {
		if command.SubCommands != nil {
			interactionsLen = interactionsLen + len(command.SubCommands.Commands)
			continue
		}

		interactionsLen = interactionsLen + 1
	}

	metrics.TotalInteractions.Set(float64(interactionsLen))
}

func reloadGuages(bot *disgolf.Bot, state *dgrs.State) {
	go reloadGuilds(state)
	go reloadChannels(state)
	go reloadInteractions(bot)
}

func AddMetricsListeners(container *di.Container) {
	bot := container.Get(static.DiBot).(*disgolf.Bot)
	state := container.Get(static.DiState).(*dgrs.State)
	cron := container.Get(static.DiCron).(*cron.Cron)

	setLatency(bot)
	cron.AddFunc("@every 1m", func() {
		go setLatency(bot)
	})

	bot.AddHandler(func(session *discordgo.Session, event *discordgo.Ready) {
		metrics.DiscordConnected.Set(1)
		go reloadGuages(bot, state)
	})

	bot.AddHandler(func(session *discordgo.Session, event *discordgo.Disconnect) {
		metrics.DiscordConnected.Set(0)
	})

	bot.AddHandler(func(session *discordgo.Session, event *discordgo.GuildCreate) {
		go reloadGuilds(state)
	})

	bot.AddHandler(func(session *discordgo.Session, event *discordgo.GuildDelete) {
		go reloadGuilds(state)
	})

	bot.AddHandler(func(session *discordgo.Session, event *discordgo.ChannelCreate) {
		go reloadChannels(state)
	})

	bot.AddHandler(func(session *discordgo.Session, event *discordgo.ChannelDelete) {
		go reloadChannels(state)
	})

	bot.AddHandler(func(session *discordgo.Session, event *discordgo.InteractionCreate) {
		if event.Type != discordgo.InteractionApplicationCommand {
			return
		}

		data := event.ApplicationCommandData()
		name := utils.GetInteractionName(&data)

		metrics.InteractionEventTotal.WithLabelValues("ChatInputCommandInteraction", name).Inc()
	})

	bot.AddHandler(func(bot *discordgo.Session, event *discordgo.InteractionCreate) {
		if event.Type != discordgo.InteractionMessageComponent {
			return
		}

		data := event.MessageComponentData()
		metrics.InteractionEventTotal.WithLabelValues("ButtonInteraction", data.CustomID).Inc()
	})
}
