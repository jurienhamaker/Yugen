import { Injectable } from '@nestjs/common';
import { Settings } from '@prisma/hoshi';
import {
	CommandInteraction,
	EmbedBuilder,
	MessageComponentInteraction,
} from 'discord.js';

import { EMBED_COLOR } from '../../../util/constants';

import { PrismaService } from '@yugen/prisma/hoshi';

@Injectable()
export class SettingsService {
	constructor(private _prisma: PrismaService) {}

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
		value: string | number | boolean | string[]
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

	async showSettings(
		interaction: MessageComponentInteraction | CommandInteraction
	) {
		const settings = await this.getSettings(interaction.guildId);

		if (!settings) {
			return;
		}

		const { treshold, self, ignoredChannelIds, botUpdatesChannelId } = settings;

		const embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setTitle('Hoshi settings')
			.setDescription(`These are the settings currently configured for Hoshi`)
			.addFields(
				{
					name: 'Treshold',
					value: treshold.toString(),
					inline: true,
				},
				{
					name: 'Author starring',
					value: self ? 'Allowed' : 'Disallowed',
					inline: true,
				},
				{
					name: 'Bot updates channel',
					value: botUpdatesChannelId?.length
						? `<#${botUpdatesChannelId}>`
						: '-',
					inline: true,
				},
				{
					name: 'Ignored Channels',
					value: ignoredChannelIds?.length
						? ignoredChannelIds.map((id: string) => `<#${id}>`).join('\n')
						: '-',
					inline: false,
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

	async ignoreChannel(
		guildId: string,
		channelId: string,
		value: boolean = true
	) {
		const settings = await this.getSettings(guildId);

		if (!settings) {
			return;
		}

		const { ignoredChannelIds } = settings;
		const index = ignoredChannelIds.indexOf(channelId);

		if (!value && index >= 0) {
			ignoredChannelIds.splice(index, 1);
		}

		if (value && index === -1) {
			ignoredChannelIds.push(channelId);
		}

		return this.set(guildId, 'ignoredChannelIds', ignoredChannelIds);
	}
}
