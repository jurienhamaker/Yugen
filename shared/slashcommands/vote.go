package slashcommands

import (
	"fmt"
	"log"
	"os"

	"github.com/bwmarrin/discordgo"
	"github.com/zekrotja/dgrs"
	"github.com/zekrotja/ken"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

type Vote struct {
	ken.SlashCommand
}

func (c *Vote) Name() string {
	return "vote"
}

func (c *Vote) Description() string {
	return "Vote for the bot!"
}

func (c *Vote) Version() string {
	return "1.0.0"
}

func (c *Vote) Options() []*discordgo.ApplicationCommandOption {
	return nil
}

func (c *Vote) Run(ctx ken.Context) (err error) {
	err = ctx.Defer()
	if err != nil {
		return
	}

	user := ctx.User()
	session := ctx.GetSession()
	name := session.State.User.Username

	voteReward := ""

	voteRewardFunc := ctx.Get(static.DiVoteReward).(func(userId string) string)
	embedColor := ctx.Get(static.DiEmbedColor).(int)

	if voteRewardFunc != nil {
		voteReward = voteRewardFunc(user.ID)
	}

	if len(voteReward) > 0 {
		voteReward = "\n" + voteReward
	}

	footer, err := utils.CreateEmbedFooter(
		ctx.Get(static.DiDiscordSession).(*discordgo.Session),
		ctx.Get(static.DiState).(*dgrs.State),
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

	resp := ctx.FollowUpEmbed(embed)

	topGGVoteLink := os.Getenv(static.EnvTopGGVoteLink)
	discordBotListVoteLink := os.Getenv(static.EnvDiscordBotListVoteLink)
	botsGGVoteLink := os.Getenv(static.EnvBotsGGVoteLink)

	if len(topGGVoteLink) > 0 || len(discordBotListVoteLink) > 0 || len(botsGGVoteLink) > 0 {
		resp.AddComponents(func(cb *ken.ComponentBuilder) {
			cb.AddActionsRow(func(b ken.ComponentAssembler) {
				if len(topGGVoteLink) > 0 {
					log.Println("Adding top.gg", topGGVoteLink)
					b.Add(discordgo.Button{
						Label: "Vote on Top.GG",
						URL:   topGGVoteLink,
					}, nil)
				}

				if len(discordBotListVoteLink) > 0 {
					log.Println("Adding discordbotlist", discordBotListVoteLink)
					b.Add(discordgo.Button{
						Label: "Vote on Discord Bot List",
						URL:   discordBotListVoteLink,
					}, nil)
				}

				if len(botsGGVoteLink) > 0 {
					log.Println("Adding bots.gg", botsGGVoteLink)
					b.Add(discordgo.Button{
						Label: "Vote on Bots.GG",
						URL:   botsGGVoteLink,
					}, nil)
				}
			})
		})
	}

	return resp.Send().Error
}
