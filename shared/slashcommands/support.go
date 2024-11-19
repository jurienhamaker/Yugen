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

type SupportModule struct {
	container *di.Container
}

func GetSupportModule(container *di.Container) *SupportModule {
	return &SupportModule{
		container: container,
	}
}

func (m *SupportModule) support(ctx *disgolf.Ctx) {
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
	appName := m.container.Get(static.DiAppName).(string)

	embed := &discordgo.MessageEmbed{
		Color: embedColor,
		Title: fmt.Sprintf("%s support", appName),
		Description: fmt.Sprintf(`Found a bug? Or having issues setting up %s?
Join our support server with the button below, we'll try to help you out the best we can!`, appName),
		Footer: footer,
	}

	err = utils.Respond(ctx, &discordgo.InteractionResponseData{
		Embeds: []*discordgo.MessageEmbed{embed},
		Components: []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					static.ButtonDiscordSupportServer,
				},
			},
		},
	})
	if err != nil {
		log.Fatal(err)
	}
}

func (m *SupportModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "support",
			Description: "Get a support discord invite to join the support server!",
			Handler:     disgolf.HandlerFunc(m.support),
		},
	}
}
