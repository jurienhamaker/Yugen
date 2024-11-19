package slashcommands

import (
	"fmt"
	"log"
	"os"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"github.com/zekrotja/dgrs"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

type InviteModule struct {
	container *di.Container
}

func GetInviteModule(container *di.Container) *InviteModule {
	return &InviteModule{
		container: container,
	}
}

func (m *InviteModule) invite(ctx *disgolf.Ctx) {
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
		Title: fmt.Sprintf("Invite %s", appName),
		Description: fmt.Sprintf(`Do you want to share %s with your friends in another server?
Don't hesitate now and **invite %s** wherever you want using the button bellow!`, appName, appName),
		Footer: footer,
	}

	err = utils.Respond(ctx, &discordgo.InteractionResponseData{
		Embeds: []*discordgo.MessageEmbed{embed},
		Components: []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.Button{
						Style: discordgo.LinkButton,
						Label: fmt.Sprintf("Invite %s to your server 🎉", appName),
						URL:   os.Getenv("INVITE_LINK"),
					},
				},
			},
		},
	})
	if err != nil {
		log.Fatal(err)
	}
}

func (m *InviteModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "invite",
			Description: "Get a bot invite to add it to your server!",
			Handler:     disgolf.HandlerFunc(m.invite),
		},
	}
}
