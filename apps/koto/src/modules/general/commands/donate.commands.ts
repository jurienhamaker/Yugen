import { Injectable } from '@nestjs/common';
import { kofiButton } from '@yugen/koto/util/buttons';
import { EMBED_COLOR } from '@yugen/koto/util/constants';
import { getEmbedFooter } from '@yugen/koto/util/get-embed-footer';
import {
	ActionRowBuilder,
	ButtonBuilder,
	Client,
	EmbedBuilder,
} from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class GeneralDonateCommands {
	constructor(private _client: Client) {}

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
**All money raised will go towards costs of running Koto!**

Thanks for playing!`,
			)
			.setColor(EMBED_COLOR)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(kofiButton),
			],
		});
	}
}
