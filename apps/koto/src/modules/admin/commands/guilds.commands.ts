import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { ForbiddenExceptionFilter } from '@yugen/koto/filters';
import { AdminGuard } from '@yugen/koto/guards';
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
	SlashCommandContext,
	Subcommand,
} from 'necord';
import { getEmbedFooter } from '../../../util/get-embed-footer';
import { AdminCommandDecorator } from '../admin.decorator';
import { AdminGuildsService } from '../services/guilds.service';

class AdminGuildsListOptions {
	@NumberOption({
		name: 'page',
		description: 'View a specific page.',
		required: false,
	})
	page: number | undefined;
}

@UseGuards(AdminGuard)
@UseFilters(ForbiddenExceptionFilter)
@AdminCommandDecorator()
@Injectable()
export class AdminGuildsCommands {
	constructor(
		private _guilds: AdminGuildsService,
		private _client: Client,
	) {}

	@Subcommand({
		name: 'guilds',
		description: 'Get a list of guilds sorted by membersCount!',
	})
	public async list(
		@Context() [interaction]: SlashCommandContext,
		@Options() { page }: AdminGuildsListOptions,
	) {
		return this._listLeaderboard(interaction, page);
	}

	@Button('ADMIN_GUILDS_LIST/:page')
	public leaderboardButton(
		@Context()
		[interaction]: ButtonContext,
		@ComponentParam('page') page: string,
	) {
		const pageInt = parseInt(page, 10);
		return this._listLeaderboard(interaction, pageInt);
	}

	private async _listLeaderboard(
		interaction: CommandInteraction | ButtonInteraction,
		page: number = 1,
	) {
		page = page ?? 1;

		const { guilds, total } = await this._guilds.getData(page);

		if (!total) {
			const data = {
				content: `There is no guild data available.`,
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

		if (!guilds?.length) {
			const data = {
				content: `No guilds found for page ${page}`,
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

		const title = `Koto guilds`;

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setDescription(
				guilds.length
					? guilds
							.map(
								(guild, index) =>
									`${(page - 1) * 10 + (index + 1)}. ${
										guild.name
									}: **${guild.memberCount}**`,
							)
							.join('\n')
					: '',
			)
			.setFooter(footer);

		if (page > 1) {
			buttons.push(
				new ButtonBuilder()
					.setCustomId(`ADMIN_GUILDS_LIST/${page - 1}`)
					.setLabel('◀️')
					.setStyle(ButtonStyle.Primary),
			);
		}

		if (page < maxPage) {
			buttons.push(
				new ButtonBuilder()
					.setCustomId(`ADMIN_GUILDS_LIST/${page + 1}`)
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
