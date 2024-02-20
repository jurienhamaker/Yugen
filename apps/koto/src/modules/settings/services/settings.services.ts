import { Injectable, Logger } from '@nestjs/common';
import { Settings } from '@prisma/koto';
import { EMBED_COLOR } from '../../../util/constants';
import { PrismaService } from '@yugen/prisma/koto';
import { formatMinutes } from '@yugen/util';
import {
	CommandInteraction,
	EmbedBuilder,
	MessageComponentInteraction,
} from 'discord.js';

@Injectable()
export class SettingsService {
	private readonly _logger = new Logger(SettingsService.name);

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
		value: string | number | boolean,
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
		interaction: MessageComponentInteraction | CommandInteraction,
	) {
		const settings = await this.getSettings(interaction.guildId!);

		if (!settings) {
			return;
		}

		const {
			channelId,
			pingRoleId,
			pingOnlyNew,
			cooldown,
			frequency,
			timeLimit,
			autoStart,
			membersCanStart,
		} = settings;

		const frequencyFormatted = formatMinutes(frequency);
		const timeLimitFormatted = formatMinutes(timeLimit);
		const embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setTitle('Koto settings')
			.setDescription(
				`These are the settings currently configured for Koto`,
			)
			.addFields(
				{
					name: 'Channel',
					value: channelId ? `<#${channelId}>` : '-',
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
					name: ' ',
					value: ' ',
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
					name: 'Game frequency',
					value: `Every ${
						frequencyFormatted.hours
							? `${frequencyFormatted.hours} hour${
									frequencyFormatted.hours === 1 ? '' : 's'
								}`
							: ''
					}${
						frequencyFormatted.hours && frequencyFormatted.minutes
							? ' & '
							: ''
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
						timeLimitFormatted.hours && timeLimitFormatted.minutes
							? ' & '
							: ''
					}${
						timeLimitFormatted.minutes
							? `${timeLimitFormatted.minutes} minute${
									timeLimitFormatted.minutes === 1 ? '' : 's'
								}`
							: ''
					}`,
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
}
