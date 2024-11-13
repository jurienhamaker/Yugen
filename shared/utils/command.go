package utils

import (
	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
)

func Defer(ctx *disgolf.Ctx, ephemeral ...bool) (err error) {
	data := discordgo.InteractionResponseData{}

	if len(ephemeral) > 0 && ephemeral[0] {
		data.Flags = discordgo.MessageFlagsEphemeral
	}

	err = ctx.Respond(&discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseDeferredChannelMessageWithSource,
		Data: &data,
	})
	return
}

func Respond(ctx *disgolf.Ctx, data *discordgo.InteractionResponseData) (err error) {
	err = ctx.Respond(&discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: data,
	})
	return
}

func FollowUp(ctx *disgolf.Ctx, response *discordgo.WebhookParams, ephemeral ...bool) (err error) {
	if len(ephemeral) > 0 && ephemeral[0] {
		response.Flags = discordgo.MessageFlagsEphemeral
	}

	_, err = ctx.Session.FollowupMessageCreate(ctx.Interaction, true, response)
	return
}

func ForbiddenResponse(ctx *disgolf.Ctx) error {
	embed := &discordgo.MessageEmbed{
		// #ff0000
		Color:       0xff0000,
		Title:       "Forbidden",
		Description: "Sorry, you can't use this interaction!",
	}

	return Respond(ctx, &discordgo.InteractionResponseData{
		Flags:  discordgo.MessageFlagsEphemeral,
		Embeds: []*discordgo.MessageEmbed{embed},
	})
}

func ErrorResponse(ctx *disgolf.Ctx, ephemeral ...bool) error {
	embed := &discordgo.MessageEmbed{
		// #ff0000
		Color:       0xff0000,
		Title:       "Something wen't wrong",
		Description: "Sorry, something broke along the way! My developer has been informed.. Sorry for the inconvenience!",
	}

	if len(ephemeral) > 0 && ephemeral[0] {
		return FollowUp(ctx, &discordgo.WebhookParams{
			Embeds: []*discordgo.MessageEmbed{embed},
		}, ephemeral...)
	}

	return Respond(ctx, &discordgo.InteractionResponseData{
		Flags:  discordgo.MessageFlagsEphemeral,
		Embeds: []*discordgo.MessageEmbed{embed},
	})
}
