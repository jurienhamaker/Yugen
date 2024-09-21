import { Inject, Injectable } from '@nestjs/common';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Client,
	EmbedBuilder,
} from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

import {
	GeneralModuleOptions,
	MODULE_OPTIONS_TOKEN,
} from '../general.module-definition';

import { getEmbedFooter } from '@yugen/util';

@Injectable()
export class GeneralVoteCommands {
	constructor(
		private _client: Client,
		@Inject(MODULE_OPTIONS_TOKEN) private _options: GeneralModuleOptions
	) {}

	@SlashCommand({
		name: 'vote',
		description: 'Vote for the bot!',
	})
	public async vote(@Context() [interaction]: SlashCommandContext) {
		const footer = await getEmbedFooter(this._client, null, false);
		const voteReward = await this._options.voteReward(interaction.user.id);
		const embed = new EmbedBuilder()
			.setTitle(`Vote information`)
			.setDescription(
				`Like what ${
					this._client.user?.displayName
				} is doing and want to support it's growth?
Please use any of the links below to vote for ${
					this._client.user?.displayName
				}!${
					voteReward?.length
						? `

${voteReward}`
						: ''
				}`
			)
			.setColor(this._options.embedColor)
			.setFooter(footer);

		const buttons = [];

		if (process.env['TOP_GG_VOTE_LINK']?.length) {
			buttons.push(
				new ButtonBuilder()
					.setURL(process.env['TOP_GG_VOTE_LINK'])
					.setLabel('Vote on Top.GG')
					.setStyle(ButtonStyle.Link)
			);
		}

		if (process.env['DISCORDBOTLIST_VOTE_LINK']?.length) {
			buttons.push(
				new ButtonBuilder()
					.setURL(process.env['DISCORDBOTLIST_VOTE_LINK'])
					.setLabel('Vote on Discord Bot List')
					.setStyle(ButtonStyle.Link)
			);
		}

		if (process.env['BOTS_GG_VOTE_LINK']?.length) {
			buttons.push(
				new ButtonBuilder()
					.setURL(process.env['BOTS_GG_VOTE_LINK'])
					.setLabel('Vote on Bots.GG')
					.setStyle(ButtonStyle.Link)
			);
		}

		return interaction.reply({
			embeds: [embed],
			components: buttons?.length
				? [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
				: [],
		});
	}
}
