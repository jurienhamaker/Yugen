import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { Settings } from '@prisma/koto';
import { ForbiddenExceptionFilter, GuildAdminGuard } from '@yugen/shared';
import { formatMinutes } from '@yugen/util';
import { ChannelType, Role, TextChannel } from 'discord.js';
import {
	BooleanOption,
	ChannelOption,
	Context,
	NumberOption,
	Options,
	RoleOption,
	SlashCommandContext,
	StringOption,
	Subcommand,
} from 'necord';
import { SettingsService } from '../services';
import { SettingsCommandDecorator } from '../settings.decorator';

class SettingsSetChannelOptions {
	@ChannelOption({
		name: 'channel',
		description: 'The channel Koto will run in.',
		required: true,
	})
	channel: TextChannel | undefined;
}

class SettingsSetRoleOptions {
	@RoleOption({
		name: 'role',
		description: 'The channel Koto will run in.',
		required: true,
	})
	role: Role | undefined;

	@BooleanOption({
		name: 'only-new',
		description: 'Ping only the first message of a new game',
		required: true,
	})
	onlyNew: boolean;
}

class SettingsSetFrequencyOrTimeLimitOptions {
	@NumberOption({
		name: 'minutes',
		description: 'The amount of minutes between games.',
		required: true,
		min_value: 10,
	})
	minutes: number | undefined;
}

class SettingsSetCooldownOptions {
	@NumberOption({
		name: 'minutes',
		description: 'The amount of minutes between answers.',
		required: true,
		min_value: 0,
		max_value: 60,
	})
	minutes: number | undefined;
}

class SettingsSetAutoStartOptions {
	@BooleanOption({
		name: 'value',
		description: 'Wether to automatically start a game after it ends.',
		required: true,
	})
	autoStart: boolean;
}

class SettingsSetMembersPrivilegeOptions {
	@BooleanOption({
		name: 'value',
		description: 'Wether server members van start games themselves.',
		required: true,
	})
	membersCanStart: boolean;
}

const settingsResetOptionsChoices = [
	{
		name: 'Channel',
		value: 'channelId',
	},
	{
		name: 'Member privilege',
		value: 'membersCanStart',
	},
	{
		name: 'Ping role',
		value: 'pingRoleId',
	},
	{
		name: 'Answer Cooldown',
		value: 'cooldown',
	},
	{
		name: 'Game frequency',
		value: 'frequency',
	},
	{
		name: 'Time limit',
		value: 'timeLimit',
	},
	{
		name: 'Auto Start',
		value: 'autoStart',
	},
];
class SettingsResetOptions {
	@StringOption({
		name: 'setting',
		description: "The setting to reset to it's default value.",
		required: true,
		choices: settingsResetOptionsChoices,
	})
	setting: keyof Settings;
}

@UseGuards(GuildAdminGuard)
@UseFilters(ForbiddenExceptionFilter)
@SettingsCommandDecorator()
@Injectable()
export class SettingsCommands {
	constructor(private _settings: SettingsService) {}

	@Subcommand({
		name: 'show',
		description: 'Show the current settings',
	})
	public show(@Context() [interaction]: SlashCommandContext) {
		return this._settings.showSettings(interaction);
	}

	@Subcommand({
		name: 'channel',
		description: 'Set the channel Koto will run in.',
	})
	public async setChannel(
		@Context() [interaction]: SlashCommandContext,
		@Options() { channel }: SettingsSetChannelOptions,
	) {
		if (!channel || channel.type !== ChannelType.GuildText) {
			return interaction.reply({
				content: 'Selected channel must be a text channel.',
				ephemeral: true,
			});
		}

		await this._settings.set(interaction.guildId, 'channelId', channel.id);

		return interaction.reply({
			content: `I will run in <#${channel.id}> from now on.`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'ping-role',
		description: 'Set the ping role Koto will use to notify of a new game.',
	})
	public async setRole(
		@Context() [interaction]: SlashCommandContext,
		@Options() { role, onlyNew }: SettingsSetRoleOptions,
	) {
		if (!role) {
			return interaction.reply({
				content: 'A role must be provided.',
				ephemeral: true,
			});
		}

		await this._settings.set(interaction.guildId, 'pingRoleId', role.id);
		await this._settings.set(interaction.guildId, 'pingOnlyNew', onlyNew);

		return interaction.reply({
			content: `I will use <@&${role.id}> to notify members of ${
				onlyNew ? 'a new game' : 'every change in a game'
			}.`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'reset',
		description: "Reset a Koto setting to it's default value.",
	})
	public async reset(
		@Context() [interaction]: SlashCommandContext,
		@Options() { setting }: SettingsResetOptions,
	) {
		if (!setting) {
			return interaction.reply({
				content: 'A valid setting must be provided.',
				ephemeral: true,
			});
		}

		let value = null;

		if (setting === 'cooldown') {
			value = 10;
		}

		if (setting === 'frequency' || setting === 'timeLimit') {
			value = 60;
		}

		if (setting === 'autoStart') {
			value = false;
		}

		if (setting === 'pingRoleId') {
			await this._settings.set(interaction.guildId, 'pingOnlyNew', false);
		}

		await this._settings.set(interaction.guildId, setting, value);

		const name = settingsResetOptionsChoices.find(
			(v) => v.value === setting,
		).name;

		return interaction.reply({
			content: `${name} has been reset to it's default value of \`${
				value ? value : '-'
			}\``,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'frequency',
		description: 'Set the frequency between games.',
	})
	public async setFrequency(
		@Context() [interaction]: SlashCommandContext,
		@Options() { minutes }: SettingsSetFrequencyOrTimeLimitOptions,
	) {
		const settings = await this._settings.getSettings(interaction.guildId);
		if (!minutes || isNaN(minutes)) {
			return interaction.reply({
				content: 'A valid number for minutes must be provided.',
				ephemeral: true,
			});
		}

		if (minutes < 10) {
			return interaction.reply({
				content: 'A minimum of 10 minutes must be provided.',
				ephemeral: true,
			});
		}

		if (minutes < settings.timeLimit) {
			const timeLimitFormatted = formatMinutes(settings.timeLimit);
			return interaction.reply({
				content: `The frequency can not be lower than the time limit of ${
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
				}.`,
				ephemeral: true,
			});
		}

		await this._settings.set(interaction.guildId, 'frequency', minutes);

		const frequencyFormatted = formatMinutes(minutes);
		return interaction.reply({
			content: `I will start a new game every ${
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
			}.`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'time-limit',
		description: 'Set the time limit of games.',
	})
	public async setTimeLimit(
		@Context() [interaction]: SlashCommandContext,
		@Options() { minutes }: SettingsSetFrequencyOrTimeLimitOptions,
	) {
		const settings = await this._settings.getSettings(interaction.guildId);
		if (!minutes || isNaN(minutes)) {
			return interaction.reply({
				content: 'A valid number for minutes must be provided.',
				ephemeral: true,
			});
		}

		if (minutes < 10) {
			return interaction.reply({
				content: 'A minimum of 10 minutes must be provided.',
				ephemeral: true,
			});
		}

		if (minutes > settings.frequency) {
			const frequencyFormatted = formatMinutes(settings.frequency);
			return interaction.reply({
				content: `The time limit can not be higher than the frequency of ${
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
				}.`,
				ephemeral: true,
			});
		}

		await this._settings.set(interaction.guildId, 'timeLimit', minutes);

		const timeLimitFormatted = formatMinutes(minutes);
		return interaction.reply({
			content: `The time limit has been set to ${
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
			}.`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'cooldown',
		description: 'Set the cooldown between answers.',
	})
	public async setCooldown(
		@Context() [interaction]: SlashCommandContext,
		@Options() { minutes }: SettingsSetCooldownOptions,
	) {
		if (isNaN(minutes) || minutes === undefined || minutes === null) {
			return interaction.reply({
				content: 'A valid number for minutes must be provided.',
				ephemeral: true,
			});
		}

		if (minutes < 0 || minutes > 60) {
			return interaction.reply({
				content:
					'A minimum of 0 & a maximum of 60 minutes must be provided.',
				ephemeral: true,
			});
		}

		await this._settings.set(interaction.guildId, 'cooldown', minutes);

		return interaction.reply({
			content: `Members will now be able to provide an answer every ${minutes} minute${
				minutes === 1 ? '' : 's'
			}.`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'auto-start',
		description:
			'Wether a game should automatically start a new one after the previous ended.',
	})
	public async setAutoStart(
		@Context() [interaction]: SlashCommandContext,
		@Options() { autoStart }: SettingsSetAutoStartOptions,
	) {
		await this._settings.set(interaction.guildId, 'autoStart', autoStart);

		return interaction.reply({
			content: autoStart
				? 'I will **automatically** start a new game when the previous one ended.'
				: 'I will **not** start a new game after the previous one ended.',
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'members-privilege',
		description: 'Wether server members van start games themselves.',
	})
	public async setMemberCanStart(
		@Context() [interaction]: SlashCommandContext,
		@Options() { membersCanStart }: SettingsSetMembersPrivilegeOptions,
	) {
		await this._settings.set(
			interaction.guildId,
			'membersCanStart',
			membersCanStart,
		);

		return interaction.reply({
			content: `Members are **${
				membersCanStart ? '' : 'not '
			}allowed** to start games themselves.`,
			ephemeral: true,
		});
	}
}
