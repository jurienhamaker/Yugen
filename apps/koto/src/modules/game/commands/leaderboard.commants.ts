import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
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

import { ForbiddenExceptionFilter, ManageServerGuard } from '@yugen/shared';

import { getEmbedFooter } from '@yugen/util';

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
	constructor(private _points: GamePointsService, private _client: Client) {}

	@SlashCommand({
		name: 'leaderboard',
		description: 'Get the current servers leaderboard!',
	})
	public async leaderboard(
		@Context() [interaction]: SlashCommandContext,
		@Options() { page, type }: GameLeaderboardOptions
	) {
		return this._listLeaderboard(interaction, type ?? 'points', page);
	}

	@UseGuards(ManageServerGuard)
	@UseFilters(ForbiddenExceptionFilter)
	@SlashCommand({
		name: 'reset-leaderboard',
		description: 'Reset all player points and completely reset the leaderboard',
	})
	public async reset(@Context() [interaction]: SlashCommandContext) {
		const footer = await getEmbedFooter(this._client);
		const embed = new EmbedBuilder()
			.setTitle(`Reset leaderboard`)
			.setDescription(
				`Are you sure you want to reset the leaderboard of **${interaction.guild.name}**
**This action is irreversible**`
			)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					new ButtonBuilder()
						.setCustomId(`RESET_LEADERBOARD/yes`)
						.setLabel('Reset leaderboard')
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId(`RESET_LEADERBOARD/no`)
						.setLabel('Cancel')
						.setStyle(ButtonStyle.Danger),
				]),
			],
			ephemeral: true,
		});
	}

	@UseGuards(ManageServerGuard)
	@UseFilters(ForbiddenExceptionFilter)
	@Button('RESET_LEADERBOARD/:type')
	public async resetButton(
		@Context()
		[interaction]: ButtonContext,
		@ComponentParam('type') type: 'yes' | 'no'
	) {
		if (type !== 'yes') {
			return interaction.update({
				content: `I have not reset the leaderboard`,
				components: [],
				embeds: [],
			});
		}

		await this._points.resetLeaderboard(interaction.guildId);
		return interaction.update({
			content: `The leaderboard has been reset.`,
			components: [],
			embeds: [],
		});
	}

	@Button('LEADERBOARD_LIST/:type/:page')
	public leaderboardButton(
		@Context()
		[interaction]: ButtonContext,
		@ComponentParam('type') type: 'points' | 'participated' | 'wins',
		@ComponentParam('page') page: string
	) {
		const pageInt = Number.parseInt(page, 10);
		return this._listLeaderboard(interaction, type, pageInt);
	}

	private async _listLeaderboard(
		interaction: CommandInteraction | ButtonInteraction,
		type: 'points' | 'participated' | 'wins' = 'points',
		page: number = 1
	) {
		page = page ?? 1;
		type = type ?? 'points';

		const { players, total } = await this._points.getLeaderboard(
			interaction.guild.id,
			type,
			page
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
			maxPage > 1 ? `Page ${page}/${maxPage}` : null
		);

		const buttons = [];
		const components = [];

		const title = `Koto ${
			type === 'points' ? 'Points' : (type === 'wins' ? 'Wins' : 'Participation')
		} leaderboard for ${interaction.guild.name}`;

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setThumbnail(interaction.guild.iconURL() ?? null)
			.setDescription(
				players.length > 0
					? players
							.map(
								(player, index) =>
									`${(page - 1) * 10 + (index + 1)}. <@${player.userId}>: **${
										player[type]
									}**`
							)
							.join('\n')
					: ''
			)
			.setFooter(footer);

		if (page > 1) {
			buttons.push(
				new ButtonBuilder()
					.setCustomId(`LEADERBOARD_LIST/${type}/${page - 1}`)
					.setLabel('◀️')
					.setStyle(ButtonStyle.Primary)
			);
		}

		if (page < maxPage) {
			buttons.push(
				new ButtonBuilder()
					.setCustomId(`LEADERBOARD_LIST/${type}/${page + 1}`)
					.setLabel('▶️')
					.setStyle(ButtonStyle.Primary)
			);
		}

		if (buttons.length > 0) {
			components.push(
				new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)
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
			ephemeral: true,
		});
	}
}
