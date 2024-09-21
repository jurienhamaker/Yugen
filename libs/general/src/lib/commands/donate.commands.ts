import { Inject, Injectable } from '@nestjs/common';
import {
	ActionRowBuilder,
	ButtonBuilder,
	Client,
	EmbedBuilder,
} from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

import {
	GeneralModuleOptions,
	MODULE_OPTIONS_TOKEN,
} from '../general.module-definition';

import { getEmbedFooter, kofiButton } from '@yugen/util';

@Injectable()
export class GeneralDonateCommands {
	constructor(
		private _client: Client,
		@Inject(MODULE_OPTIONS_TOKEN) private _options: GeneralModuleOptions
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

Thanks for playing!`
			)
			.setColor(this._options.embedColor)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(kofiButton),
			],
		});
	}
}
