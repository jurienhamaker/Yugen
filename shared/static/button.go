package static

import "github.com/bwmarrin/discordgo"

var (
	ButtonDiscordSupportServer = discordgo.Button{
		Style: discordgo.LinkButton,
		Label: "Join support server 👨‍⚕️",
		URL:   "https://discord.gg/UttZbEd9zn",
	}
	ButtonKofi = discordgo.Button{
		Style: discordgo.LinkButton,
		Label: "Open Ko-Fi page ☕",
		URL:   "https://ko-fi.com/jurienhamaker",
	}
)
