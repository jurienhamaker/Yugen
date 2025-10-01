import { Injectable } from '@nestjs/common';
import { Settings } from '@prisma/koto';
import {
	CommandInteraction,
	EmbedBuilder,
	MessageComponentInteraction,
} from 'discord.js';

import { EMBED_COLOR } from '../../../util/constants';

import { formatMinutes } from '@yugen/util';

import { PrismaService } from '@yugen/prisma/koto';

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
		value: string | number | boolean
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

		const {
			channelId,
			botUpdatesChannelId,
			pingRoleId,
			pingOnlyNew,
			cooldown,
			enableRepeatCooldown,
			repeatCooldown,
			informCooldownAfterGuess,
			frequency,
			timeLimit,
			autoStart,
			membersCanStart,
			startAfterFirstGuess,
		} = settings;

		const frequencyFormatted = formatMinutes(frequency);
		const timeLimitFormatted = formatMinutes(timeLimit);
		const embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setTitle('Koto settings')
			.setDescription(`These are the settings currently configured for Koto`)
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
					name: 'Members privilege',
					value: membersCanStart
						? `Allowed to start games`
						: "Can't start games",
					inline: true,
				},
				{
					name: 'Ping role',
					value: pingRoleId ? `<@&${pingRoleId}>` : '-',
					inline: true,
				},
				{
					name: 'Ping type',
					value: pingOnlyNew ? 'New games' : 'Every change',
					inline: true,
				},
				{
					name: 'Auto start games',
					value: autoStart ? 'Yes' : 'No',
					inline: true,
				},
				{
					name: 'Answer cooldown',
					value: `${cooldown} minute${cooldown === 1 ? '' : 's'}`,
					inline: true,
				},
				{
					name: 'Repeat answer cooldown',
					value: enableRepeatCooldown
						? `${repeatCooldown} minute${repeatCooldown === 1 ? '' : 's'}`
						: 'Disabled',
					inline: true,
				},
				{
					name: 'Inform cooldown',
					value: informCooldownAfterGuess ? 'Yes' : 'No',
					inline: true,
				},
				{
					name: 'Game frequency',
					value: `Every ${
						frequencyFormatted.hours
							? `${frequencyFormatted.hours} hour${
									frequencyFormatted.hours === 1 ? '' : 's'
							  }`
							: ''
					}${
						frequencyFormatted.hours && frequencyFormatted.minutes ? ' & ' : ''
					}${
						frequencyFormatted.minutes
							? `${frequencyFormatted.minutes} minute${
									frequencyFormatted.minutes === 1 ? '' : 's'
							  }`
							: ''
					}`,
					inline: true,
				},
				{
					name: 'Time limit',
					value: `${
						timeLimitFormatted.hours
							? `${timeLimitFormatted.hours} hour${
									timeLimitFormatted.hours === 1 ? '' : 's'
							  }`
							: ''
					}${
						timeLimitFormatted.hours && timeLimitFormatted.minutes ? ' & ' : ''
					}${
						timeLimitFormatted.minutes
							? `${timeLimitFormatted.minutes} minute${
									timeLimitFormatted.minutes === 1 ? '' : 's'
							  }`
							: ''
					}`,
					inline: true,
				},
				{
					name: 'Timer after first guess',
					value: startAfterFirstGuess ? 'Yes' : 'No',
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
}
