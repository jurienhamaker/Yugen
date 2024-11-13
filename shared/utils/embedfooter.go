package utils

import (
	"fmt"
	"os"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"github.com/zekrotja/dgrs"
)

type CreateEmbedFooterParams struct {
	Text   string
	IsVote bool
}

func CreateEmbedFooter(bot *disgolf.Bot, state *dgrs.State, params *CreateEmbedFooterParams) (embed *discordgo.MessageEmbedFooter, err error) {
	botAuthor, err := state.User(os.Getenv("OWNER_ID"))
	if err != nil {
		return
	}

	text := fmt.Sprintf("Created by @%s", botAuthor.Username)
	if len(params.Text) > 0 {
		text = fmt.Sprintf("%s | %s", params.Text, text)
	}

	if !params.IsVote {
		name := bot.State.User.Username
		text = fmt.Sprintf("Like %s? Please vote using /vote! | %s", name, text)
	}

	embed = &discordgo.MessageEmbedFooter{
		IconURL: botAuthor.AvatarURL("64"),
		Text:    text,
	}

	return
}
