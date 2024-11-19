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

type DonateModule struct {
	container *di.Container
}

func GetDonateModule(container *di.Container) *DonateModule {
	return &DonateModule{
		container: container,
	}
}

func (m *DonateModule) donate(ctx *disgolf.Ctx) {
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
		Title: "Donate information",
		Description: fmt.Sprintf(`Thanks you for checking out the donate link, clicking on the button below will lead you to my ko-fi.
**All money raised will go towards costs of running %s!**

Thanks for playing!`, appName),
		Footer: footer,
	}

	err = utils.Respond(ctx, &discordgo.InteractionResponseData{
		Embeds: []*discordgo.MessageEmbed{embed},
		Components: []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					static.ButtonKofi,
				},
			},
		},
	})
	if err != nil {
		log.Fatal(err)
	}
}

func (m *DonateModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "donate",
			Description: "Get information about donating to the bot!",
			Handler:     disgolf.HandlerFunc(m.donate),
		},
	}
}
