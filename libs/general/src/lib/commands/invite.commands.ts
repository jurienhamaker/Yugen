import { Inject, Injectable } from '@nestjs/common';
import { getEmbedFooter } from '@yugen/util';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Client,
	ColorResolvable,
	EmbedBuilder,
} from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class GeneralInviteCommands {
	constructor(
		private _client: Client,
		@Inject('EMBED_COLOR') private _embedColor: ColorResolvable,
	) {}

	@SlashCommand({
		name: 'invite',
		description: 'Get a bot invite to add it to your server!',
	})
	public async invite(@Context() [interaction]: SlashCommandContext) {
		const footer = await getEmbedFooter(this._client);
		const embed = new EmbedBuilder()
			.setTitle(`Invite ${this._client.user?.displayName}`)
			.setDescription(
				`Do you want to share ${this._client.user?.displayName} with your friends in another server?
Don't hesitate now and **invite ${this._client.user?.displayName}** wherever you want using the button bellow!`,
			)
			.setColor(this._embedColor)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setURL(process.env.INVITE_LINK)
						.setLabel(
							`Invite ${this._client.user?.displayName} to your Server 🎉`,
						)
						.setStyle(ButtonStyle.Link),
				),
			],
		});
	}
}
