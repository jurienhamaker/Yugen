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

type VoteModule struct {
	container *di.Container
}

func GetVoteModule(container *di.Container) *VoteModule {
	return &VoteModule{
		container: container,
	}
}

func (m *VoteModule) Run(ctx *disgolf.Ctx) {
	err := utils.Defer(ctx)
	if err != nil {
		return
	}

	user := ctx.Interaction.Member.User
	bot := ctx.State.User
	name := bot.Username

	voteReward := ""

	voteRewardFunc := m.container.Get(static.DiVoteReward).(func(userId string) string)
	embedColor := m.container.Get(static.DiEmbedColor).(int)

	if voteRewardFunc != nil && user != nil {
		voteReward = voteRewardFunc(user.ID)
	}

	if len(voteReward) > 0 {
		voteReward = "\n" + voteReward
	}

	footer, err := utils.CreateEmbedFooter(
		m.container.Get(static.DiBot).(*disgolf.Bot),
		m.container.Get(static.DiState).(*dgrs.State),
		&utils.CreateEmbedFooterParams{
			IsVote: true,
		},
	)
	if err != nil {
		return
	}

	embed := &discordgo.MessageEmbed{
		Color: embedColor,
		Title: "Vote information",
		Description: fmt.Sprintf(`Like what %s is doing and want to support it's growth?
Please use any of the links below to vote for %s!%s`, name, name, voteReward),
		Footer: footer,
	}

	components := []discordgo.MessageComponent{}

	topGGVoteLink := os.Getenv(static.EnvTopGGVoteLink)
	discordBotListVoteLink := os.Getenv(static.EnvDiscordBotListVoteLink)

	if len(topGGVoteLink) > 0 {
		components = append(components, discordgo.Button{
			Style: discordgo.LinkButton,
			Label: "Vote on Top.GG",
			URL:   topGGVoteLink,
		})
	}

	if len(discordBotListVoteLink) > 0 {
		components = append(components, discordgo.Button{
			Style: discordgo.LinkButton,
			Label: "Vote on Discord Bot List",
			URL:   discordBotListVoteLink,
		})
	}

	messageComponents := []discordgo.MessageComponent{}

	if len(components) > 0 {
		messageComponents = append(messageComponents, discordgo.ActionsRow{
			Components: components,
		})
	}

	err = utils.FollowUp(ctx, &discordgo.WebhookParams{
		Embeds:     []*discordgo.MessageEmbed{embed},
		Components: messageComponents,
	})
	if err != nil {
		log.Fatal(err)
	}
}

func (m *VoteModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "vote",
			Description: "Vote for the bot!",
			Handler:     disgolf.HandlerFunc(m.Run),
		},
	}
}
