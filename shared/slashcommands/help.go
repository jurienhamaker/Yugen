package slashcommands

import (
	"fmt"
	"log"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"github.com/zekrotja/dgrs"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

type HelpModule struct {
	container *di.Container
}

func GetHelpModule(container *di.Container) *HelpModule {
	return &HelpModule{
		container: container,
	}
}

func (m *HelpModule) tutorial(ctx *disgolf.Ctx) {
	footer, err := utils.CreateEmbedFooter(
		m.container.Get(static.DiBot).(*disgolf.Bot),
		m.container.Get(static.DiState).(*dgrs.State),
		&utils.CreateEmbedFooterParams{
			IsVote: false,
		},
	)
	if err != nil {
		return
	}

	embedColor := m.container.Get(static.DiEmbedColor).(int)
	helpText := m.container.Get(static.DiHelpText).(string)
	appName := m.container.Get(static.DiAppName).(string)

	embed := &discordgo.MessageEmbed{
		Color:       embedColor,
		Title:       fmt.Sprintf("%s setup", appName),
		Description: helpText,
		Footer:      footer,
	}

	err = utils.Respond(ctx, &discordgo.InteractionResponseData{
		Embeds: []*discordgo.MessageEmbed{embed},
	})
	if err != nil {
		log.Fatal(err)
	}
}

func (m *HelpModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "help",
			Description: "How to setup the bot!",
			Handler:     disgolf.HandlerFunc(m.tutorial),
		},
	}
}
