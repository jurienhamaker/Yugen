import { Injectable } from '@nestjs/common';
import { EMBED_COLOR } from '@yugen/koto/util/constants';
import { getEmbedFooter } from '@yugen/koto/util/get-embed-footer';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Client,
	EmbedBuilder,
} from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class GeneralInviteCommands {
	constructor(private _client: Client) {}

	@SlashCommand({
		name: 'invite',
		description: 'Get a bot invite to add Koto to your server!',
	})
	public async invite(@Context() [interaction]: SlashCommandContext) {
		const footer = await getEmbedFooter(this._client);
		const embed = new EmbedBuilder()
			.setTitle(`Invite Koto`)
			.setDescription(
				`Do you want to share Koto with your friends in another server?
Don't hesitate now and **invite Koto** wherever you want using the button bellow!`,
			)
			.setColor(EMBED_COLOR)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setURL(process.env.INVITE_LINK)
						.setLabel('Invite Koto to your Server 🎉')
						.setStyle(ButtonStyle.Link),
				),
			],
		});
	}
}
