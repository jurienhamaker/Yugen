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
export class GeneralVoteCommands {
	constructor(
		private _client: Client,
		@Inject('EMBED_COLOR') private _embedColor: ColorResolvable,
	) {}

	@SlashCommand({
		name: 'vote',
		description: 'Vote for the bot!',
	})
	public async invite(@Context() [interaction]: SlashCommandContext) {
		const footer = await getEmbedFooter(this._client, null, false);
		const embed = new EmbedBuilder()
			.setTitle(`Vote information`)
			.setDescription(
				`Like what ${this._client.user?.displayName} is doing and want to support it's growth?
Please use any of the links below to vote for ${this._client.user?.displayName}!

*Rewards Coming Soon*`,
			)
			.setColor(this._embedColor)
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
