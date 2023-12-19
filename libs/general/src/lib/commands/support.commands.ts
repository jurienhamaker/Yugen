import { Inject, Injectable } from '@nestjs/common';
import { getEmbedFooter, supportServerButton } from '@yugen/util';
import {
	ActionRowBuilder,
	ButtonBuilder,
	Client,
	ColorResolvable,
	EmbedBuilder,
} from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class GeneralSupportCommands {
	constructor(
		private _client: Client,
		@Inject('EMBED_COLOR') private _embedColor: ColorResolvable,
	) {}

	@SlashCommand({
		name: 'support',
		description: 'Get a support discord invite to join the support server!',
	})
	public async invite(@Context() [interaction]: SlashCommandContext) {
		const footer = await getEmbedFooter(this._client);
		const embed = new EmbedBuilder()
			.setTitle(`${this._client.user?.displayName} Support`)
			.setDescription(
				`Found a bug? Or having issues setting up ${this._client.user?.displayName}?
Join our support server with the button below, we'll try to help you out the best we can!`,
			)
			.setColor(this._embedColor)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					supportServerButton,
				),
			],
		});
	}
}
