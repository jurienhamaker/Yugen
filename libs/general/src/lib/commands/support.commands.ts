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

import { getEmbedFooter, supportServerButton } from '@yugen/util';

@Injectable()
export class GeneralSupportCommands {
	constructor(
		private _client: Client,
		@Inject(MODULE_OPTIONS_TOKEN) private _options: GeneralModuleOptions
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
Join our support server with the button below, we'll try to help you out the best we can!`
			)
			.setColor(this._options.embedColor)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					supportServerButton
				),
			],
		});
	}
}
