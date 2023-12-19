import { Injectable } from '@nestjs/common';
import { getEmbedFooter } from '@yugen/util';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	Client,
	CommandInteraction,
	EmbedBuilder,
} from 'discord.js';
import {
	Button,
	ButtonContext,
	ComponentParam,
	Context,
	NumberOption,
	Options,
	SlashCommand,
	SlashCommandContext,
	StringOption,
} from 'necord';
import { GamePointsService } from '../services/points.service';

class GameLeaderboardOptions {
	@StringOption({
		name: 'type',
		description: 'The type of leaderboard to view',
		required: false,
		choices: [
			{
				name: 'Points',
				value: 'points',
			},
			{
				name: 'Guessed games participations',
				value: 'participated',
			},
			{
				name: 'Guessed words',
				value: 'wins',
			},
		],
	})
	type: 'points' | 'participated' | 'wins' | undefined;

	@NumberOption({
		name: 'page',
		description: 'View a specific page.',
		required: false,
	})
	page: number | undefined;
}

@Injectable()
export class GameLeaderboardCommands {
	constructor(
		private _points: GamePointsService,
		private _client: Client,
	) {}

	@SlashCommand({
		name: 'leaderboard',
		description: 'Get the current servers leaderboard!',
	})
	public async leaderboard(
		@Context() [interaction]: SlashCommandContext,
		@Options() { page, type }: GameLeaderboardOptions,
	) {
		return this._listLeaderboard(interaction, type ?? 'points', page);
	}

	@Button('LEADERBOARD_LIST/:type/:page')
	public leaderboardButton(
		@Context()
		[interaction]: ButtonContext,
		@ComponentParam('type') type: 'points' | 'participated' | 'wins',
		@ComponentParam('page') page: string,
	) {
		const pageInt = parseInt(page, 10);
		return this._listLeaderboard(interaction, type, pageInt);
	}

	private async _listLeaderboard(
		interaction: CommandInteraction | ButtonInteraction,
		type: 'points' | 'participated' | 'wins' = 'points',
		page: number = 1,
	) {
		page = page ?? 1;
		type = type ?? 'points';

		const { players, total } = await this._points.getLeaderboard(
			interaction.guild.id,
			type,
			page,
		);

		if (!total) {
			const data = {
				content: `There is no leaderboard available yet for this server.`,
				embeds: [],
				components: [],
			};

			if (interaction instanceof ButtonInteraction) {
				return interaction.update(data);
			}

			return interaction.reply({
				...data,
				ephemeral: true,
			});
		}

		if (!players?.length) {
			const data = {
				content: `No players found for page ${page}`,
				embeds: [],
				components: [],
			};

			if (interaction instanceof ButtonInteraction) {
				return interaction.update(data);
			}

			return interaction.reply({
				...data,
				ephemeral: true,
			});
		}

		const maxPage = Math.ceil(total / 10);

		const footer = await getEmbedFooter(
			this._client,
			maxPage > 1 ? `Page ${page}/${maxPage}` : null,
		);

		const buttons = [];
		const components = [];

		const title = `Koto ${
			type === 'points'
				? 'Points'
				: type === 'wins'
					? 'Wins'
					: 'Participation'
		} leaderboard for ${interaction.guild.name}`;

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setThumbnail(interaction.guild.iconURL() ?? null)
			.setDescription(
				players.length
					? players
							.map(
								(player, index) =>
									`${(page - 1) * 10 + (index + 1)}. <@${
										player.userId
									}>: **${player[type]}**`,
							)
							.join('\n')
					: '',
			)
			.setFooter(footer);

		if (page > 1) {
			buttons.push(
				new ButtonBuilder()
					.setCustomId(`LEADERBOARD_LIST/${type}/${page - 1}`)
					.setLabel('◀️')
					.setStyle(ButtonStyle.Primary),
			);
		}

		if (page < maxPage) {
			buttons.push(
				new ButtonBuilder()
					.setCustomId(`LEADERBOARD_LIST/${type}/${page + 1}`)
					.setLabel('▶️')
					.setStyle(ButtonStyle.Primary),
			);
		}

		if (buttons.length) {
			components.push(
				new ActionRowBuilder<ButtonBuilder>().addComponents(buttons),
			);
		}

		if (interaction instanceof ButtonInteraction) {
			return interaction.update({
				embeds: [embed],
				components,
			});
		}

		return interaction.reply({
			embeds: [embed],
			components,
		});
	}
}
