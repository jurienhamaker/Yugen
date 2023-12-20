import { Injectable, Logger } from '@nestjs/common';
import { Settings } from '@prisma/kusari';
import { EMBED_COLOR } from '@yugen/kusari/util/constants';
import { PrismaService } from '@yugen/prisma/kusari';
import {
	Client,
	CommandInteraction,
	EmbedBuilder,
	MessageComponentInteraction,
} from 'discord.js';

@Injectable()
export class SettingsService {
	private readonly _logger = new Logger(SettingsService.name);

	constructor(
		private _prisma: PrismaService,
		private _client: Client,
	) {}

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
		value: string | number | Date,
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
		interaction: MessageComponentInteraction | CommandInteraction,
	) {
		const settings = await this.getSettings(interaction.guildId!);

		if (!settings) {
			return;
		}

		const { channelId, cooldown } = settings;

		const embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setTitle('Kusari settings')
			.setDescription(
				`These are the settings currently configured for Kusari`,
			)
			.addFields(
				{
					name: 'Channel',
					value: channelId ? `<#${channelId}>` : '-',
					inline: true,
				},
				{
					name: 'Answer cooldown',
					value: `${cooldown} minute${cooldown === 1 ? '' : 's'}`,
					inline: true,
				},
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

		const newSaves = settings.saves + amount;
		return this._prisma.settings.update({
			where: {
				id: settings.id,
			},
			data: {
				saves:
					newSaves > settings.maxSaves ? settings.maxSaves : newSaves,
			},
		});
	}

	async deductSave(guildId: string, amount: number) {
		const settings = await this.getSettings(guildId);

		const newSaves = settings.saves - amount;
		return this._prisma.settings.update({
			where: {
				id: settings.id,
			},
			data: {
				saves: newSaves < 0 ? 0 : newSaves,
			},
		});
	}
}
