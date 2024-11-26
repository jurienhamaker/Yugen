package slashcommands

import (
	"fmt"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

type TutorialModule struct {
	container *di.Container
}

func GetTutorialModule(container *di.Container) *TutorialModule {
	return &TutorialModule{
		container: container,
	}
}

func (m *TutorialModule) tutorial(ctx *disgolf.Ctx) {
	footer, err := utils.CreateEmbedFooter(
		m.container.Get(static.DiBot).(*disgolf.Bot),
		&utils.CreateEmbedFooterParams{
			IsVote: false,
		},
	)
	if err != nil {
		return
	}

	embedColor := m.container.Get(static.DiEmbedColor).(int)
	tutorialText := m.container.Get(static.DiTutorialText).(string)
	appName := m.container.Get(static.DiAppName).(string)

	embed := &discordgo.MessageEmbed{
		Color:       embedColor,
		Title:       fmt.Sprintf("%s tutorial", appName),
		Description: tutorialText,
		Footer:      footer,
	}

	err = utils.Respond(ctx, &discordgo.InteractionResponseData{
		Embeds: []*discordgo.MessageEmbed{embed},
	})
	if err != nil {
		utils.Logger.Error(err)
	}
}

func (m *TutorialModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "tutorial",
			Description: "The rules of the game!",
			Handler:     disgolf.HandlerFunc(m.tutorial),
		},
	}
}
