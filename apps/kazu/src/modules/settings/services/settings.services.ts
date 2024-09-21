import { Injectable } from '@nestjs/common';
import { Settings } from '@prisma/kazu';
import {
	Client,
	CommandInteraction,
	EmbedBuilder,
	MessageComponentInteraction,
} from 'discord.js';

import { EMBED_COLOR } from '../../../util/constants';

import { fixFloating } from '@yugen/util';

import { PrismaService } from '@yugen/prisma/kazu';

@Injectable()
export class SettingsService {
	constructor(private _prisma: PrismaService, private _client: Client) {}

	async getSettings(guildId: string) {
		const settings = await this._prisma.settings.findUnique({
			where: {
				guildId,
			},
		});

		if (!settings) {
			return this._prisma.settings.create({
				data: { guildId },
			});
		}

		return settings;
	}

	delete(guildId: string) {
		return this._prisma.settings.delete({
			where: {
				guildId,
			},
		});
	}

	async set(
		guildId: string,
		property: keyof Settings,
		value: string | number | Date | boolean
	) {
		let settings = await this.getSettings(guildId);

		settings = {
			...settings,
			[property]: value,
		};

		return this._prisma.settings.update({
			where: {
				guildId,
			},
			data: settings,
		});
	}

	async getConfiguredChannel(guildId: string) {
		const { channelId } = await this.getSettings(guildId);

		const guild = await this._client.guilds.fetch(guildId);
		if (!guild) {
			return;
		}

		const channel = await guild.channels.fetch(channelId);
		if (!guild) {
			return;
		}

		return channel;
	}

	async showSettings(
		interaction: MessageComponentInteraction | CommandInteraction
	) {
		const settings = await this.getSettings(interaction.guildId);

		if (!settings) {
			return;
		}

		const {
			channelId,
			cooldown,
			math,
			shameRoleId,
			botUpdatesChannelId,
			removeShameRoleAfterHighscore,
		} = settings;

		const embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setTitle('Kazu settings')
			.setDescription(`These are the settings currently configured for Kazu`)
			.addFields(
				{
					name: 'Channel',
					value: channelId ? `<#${channelId}>` : '-',
					inline: true,
				},
				{
					name: 'Bot updates channel',
					value: botUpdatesChannelId ? `<#${botUpdatesChannelId}>` : '-',
					inline: true,
				},
				{
					name: 'Answer cooldown',
					value: `${cooldown} minute${cooldown === 1 ? '' : 's'}`,
					inline: true,
				},
				{
					name: 'Math',
					value: math ? 'Enabled' : 'Disabled',
					inline: true,
				},
				{
					name: 'Shame role',
					value: shameRoleId ? `<@&${shameRoleId}>` : '-',
					inline: true,
				},
				{
					name: 'Remove shame role on highschore',
					value: removeShameRoleAfterHighscore ? 'Yes' : 'No',
					inline: true,
				}
			);

		const data = {
			content: '',
			embeds: [embed],
		};

		if (interaction instanceof MessageComponentInteraction) {
			return interaction.update(data);
		}

		return interaction.reply({
			...data,
			ephemeral: true,
		});
	}

	async addSave(guildId: string, amount: number) {
		const settings = await this.getSettings(guildId);

		const updatedSaves = fixFloating(settings.saves + amount);
		return this._prisma.settings.update({
			where: {
				id: settings.id,
			},
			data: {
				saves:
					updatedSaves > settings.maxSaves ? settings.maxSaves : updatedSaves,
			},
		});
	}

	async deductSave(guildId: string, amount: number) {
		const settings = await this.getSettings(guildId);

		const updatedSaves = fixFloating(settings.saves - amount);
		return this._prisma.settings.update({
			where: {
				id: settings.id,
			},
			data: {
				saves: updatedSaves < 0 ? 0 : updatedSaves,
			},
		});
	}
}
