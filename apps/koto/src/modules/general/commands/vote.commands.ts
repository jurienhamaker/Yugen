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
export class GeneralVoteCommands {
	constructor(private _client: Client) {}

	@SlashCommand({
		name: 'vote',
		description: 'Vote for koto!',
	})
	public async invite(@Context() [interaction]: SlashCommandContext) {
		const footer = await getEmbedFooter(this._client, null, false);
		const embed = new EmbedBuilder()
			.setTitle(`Vote information`)
			.setDescription(
				`Like what Koto is doing and want to support it's growth?
Please use any of the links below to vote for Koto!

*Rewards Coming Soon*`,
			)
			.setColor(EMBED_COLOR)
			.setFooter(footer);

		const buttons = [];

		if (process.env.TOP_GG_VOTE_LINK?.length) {
			buttons.push(
				new ButtonBuilder()
					.setURL(process.env.TOP_GG_VOTE_LINK)
					.setLabel('Vote on Top.GG')
					.setStyle(ButtonStyle.Link),
			);
		}

		if (process.env.DISCORDBOTLIST_VOTE_LINK?.length) {
			buttons.push(
				new ButtonBuilder()
					.setURL(process.env.DISCORDBOTLIST_VOTE_LINK)
					.setLabel('Vote on Discord Bot List')
					.setStyle(ButtonStyle.Link),
			);
		}

		if (process.env.DISCORDS_VOTE_LINK?.length) {
			buttons.push(
				new ButtonBuilder()
					.setURL(process.env.DISCORDS_VOTE_LINK)
					.setLabel('Vote on Discords')
					.setStyle(ButtonStyle.Link),
			);
		}

		if (process.env.BOTS_GG_VOTE_LINK?.length) {
			buttons.push(
				new ButtonBuilder()
					.setURL(process.env.BOTS_GG_VOTE_LINK)
					.setLabel('Vote on Bots.GG')
					.setStyle(ButtonStyle.Link),
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
