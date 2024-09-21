import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	CommandInteraction,
	EmbedBuilder,
	TextChannel,
} from 'discord.js';
import {
	Button,
	ButtonContext,
	ChannelOption,
	ComponentParam,
	Context,
	NumberOption,
	Options,
	SlashCommandContext,
	StringOption,
	Subcommand,
} from 'necord';

import { EMBED_COLOR } from '../../../util/constants';
import { StarboardService } from '../services/starboard.service';
import { StarboardCommandDecorator } from '../starboard.decorator';

import { ForbiddenExceptionFilter, GuildModeratorGuard } from '@yugen/shared';

import { DiscordComponentsArrayDTO, resolveEmoji } from '@yugen/util';

class ListOptions {
	@NumberOption({
		name: 'page',
		description: 'The page to view',
		required: false,
		min_value: 1,
		max_value: 999,
	})
	page: number | undefined;
}

class AddOptions {
	@ChannelOption({
		name: 'destination',
		description: 'The destination channel to keep the starboard in',
		required: true,
	})
	destinationChannel: TextChannel;

	@StringOption({
		name: 'emoji',
		description: 'An emoji to check for',
	})
	emojiString: string;

	@ChannelOption({
		name: 'source',
		description: 'A source channel to check',
	})
	sourceChannel: TextChannel;
}

class RemoveOptions {
	@NumberOption({
		name: 'id',
		description: 'The id of a configuration to remove',
		required: true,
	})
	id: number | undefined;
}

@UseGuards(GuildModeratorGuard)
@UseFilters(ForbiddenExceptionFilter)
@StarboardCommandDecorator()
export class StarboardCommands {
	private readonly _logger = new Logger(StarboardCommands.name);

	constructor(private _starboard: StarboardService) {}

	@Subcommand({
		name: 'list',
		description: 'List the starboards',
	})
	public async show(
		@Context() [interaction]: SlashCommandContext,
		@Options() { page }: ListOptions
	) {
		return this._listStarboards(interaction, page);
	}

	@Button('STARBOARD_LIST/:page')
	public onShowButton(
		@Context()
		[interaction]: ButtonContext,
		@ComponentParam('page') page: string
	) {
		const pageInt = Number.parseInt(page, 10);
		return this._listStarboards(interaction, pageInt);
	}

	@Subcommand({
		name: 'add',
		description: 'Add a starboard',
	})
	public async add(
		@Context() [interaction]: SlashCommandContext,
		@Options()
		{ emojiString, sourceChannel, destinationChannel }: AddOptions
	) {
		this._logger.verbose(
			`Adding starboard configuration for ${interaction.guildId} - source: ${
				sourceChannel?.id ?? 'none'
			} emoji: ${emojiString ?? '⭐'} destination: ${destinationChannel.id}`
		);

		emojiString = emojiString ?? '⭐';

		const emojiData = resolveEmoji(emojiString, interaction.client);
		const { found, emoji, clientEmoji, unicode } = emojiData;

		if (!found) {
			return interaction.reply({
				content: `You can only use emojis from guilds that the bot is in.`,
				ephemeral: true,
			});
		}

		const configuration = await this._starboard.getStarboardBySourceIdAndEmoji(
			interaction.guildId,
			emoji,
			sourceChannel?.id ?? null
		);

		if (configuration) {
			return interaction.reply({
				content: `A starboard for the supplied rules already exists.`,
				ephemeral: true,
			});
		}

		await this._starboard.addStarboard(
			interaction.guildId,
			emoji,
			sourceChannel?.id ?? null,
			destinationChannel.id
		);

		return interaction.reply({
			content: `A starboard has been added;
Destination: <#${destinationChannel.id}>
Emoji:  ${unicode ? emoji : clientEmoji}${
				sourceChannel
					? `
Source: <#${sourceChannel.id}>`
					: ''
			}`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'remove',
		description: 'Remove a starboard configuration',
	})
	public async remove(
		@Context() [interaction]: SlashCommandContext,
		@Options() { id }: RemoveOptions
	) {
		this._logger.verbose(
			`Removing starboard configuration for ${interaction.guildId} - ${id}`
		);

		const configuration = await this._starboard.removeStarboardByID(
			interaction.guildId,
			id
		);

		return interaction.reply({
			content: `Removed starboard configuration with ID "${configuration?.id}"`,
			ephemeral: true,
		});
	}

	private async _listStarboards(
		interaction: CommandInteraction | ButtonInteraction,
		page = 1
	) {
		page = page ?? 1;

		const { configurations, total } = await this._starboard.getStarboards(
			interaction.guildId,
			page
		);

		if (!total) {
			const data = {
				content: `No starboards have been configured yet`,
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

		if (!configurations?.length) {
			const data = {
				content: `No starboards have been found for page ${page}`,
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

		let embed = new EmbedBuilder()
			.setTitle(`Starboards for ${interaction.guild.name}`)
			.setColor(EMBED_COLOR)
			.addFields([
				{
					name: 'ID',
					value: configurations.map(c => c.id).join('\n'),
					inline: true,
				},
				{
					name: 'Emoji | Source',
					value: configurations
						.map(c => {
							const { emoji, unicode, clientEmoji } = resolveEmoji(
								c.sourceEmoji,
								interaction.client
							);

							return `${unicode ? emoji : clientEmoji} | ${
								c.sourceChannelId ? `<#${c.sourceChannelId}>` : 'Anywhere'
							}`;
						})
						.join('\n'),
					inline: true,
				},
				{
					name: 'Destination',
					value: configurations.map(c => `<#${c.targetChannelId}>`).join('\n'),
					inline: true,
				},
			]);

		if (maxPage > 1) {
			embed = embed.setFooter({
				text: `Page ${page}/${maxPage}`,
			});
		}

		const buttons = [];
		const components: DiscordComponentsArrayDTO = [];

		if (page > 1) {
			buttons.push(
				new ButtonBuilder()
					.setCustomId(`STARBOARD_LIST/${page - 1}`)
					.setLabel('◀️')
					.setStyle(ButtonStyle.Primary)
			);
		}

		if (page < maxPage) {
			buttons.push(
				new ButtonBuilder()
					.setCustomId(`STARBOARD_LIST/${page + 1}`)
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
