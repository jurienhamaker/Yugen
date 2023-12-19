import { Inject, Injectable } from '@nestjs/common';
import { getEmbedFooter, kofiButton } from '@yugen/util';
import {
	ActionRowBuilder,
	ButtonBuilder,
	Client,
	ColorResolvable,
	EmbedBuilder,
} from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class GeneralDonateCommands {
	constructor(
		private _client: Client,
		@Inject('EMBED_COLOR') private _embedColor: ColorResolvable,
	) {}

	@SlashCommand({
		name: 'donate',
		description: 'Get information about donating to the bot!',
	})
	public async invite(@Context() [interaction]: SlashCommandContext) {
		const footer = await getEmbedFooter(this._client);
		const embed = new EmbedBuilder()
			.setTitle(`Donation information`)
			.setDescription(
				`Thanks you for checking out the donate link, clicking on the button below will lead you to my ko-fi.
**All money raised will go towards costs of running ${this._client.user?.displayName}!**

Thanks for playing!`,
			)
			.setColor(this._embedColor)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(kofiButton),
			],
		});
	}
}
