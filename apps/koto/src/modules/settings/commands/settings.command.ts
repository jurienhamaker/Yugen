import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { Settings } from '@prisma/koto';
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

import { ForbiddenExceptionFilter, ManageServerGuard } from '@yugen/shared';

import { formatMinutes } from '@yugen/util';

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
		name: 'seconds',
		description: 'The amount of seconds between answers.',
		required: true,
		min_value: 0,
		max_value: 3600,
	})
	seconds: number | undefined;
}

class SettingsSetBackToBackCooldownOptions {
	@BooleanOption({
		name: 'enabled',
		description: 'Whether to enable the back to back cooldown.',
		required: true,
	})
	enabled: boolean;

	@NumberOption({
		name: 'seconds',
		description: 'The amount of seconds between back to back answers.',
		required: false,
		min_value: 0,
		max_value: 60,
	})
	seconds: number | undefined;
}

class SettingsSetInformCooldownAfterGuessOptions {
	@BooleanOption({
		name: 'value',
		description:
			'Whether to inform the user after a guess what their cooldown is.',
		required: true,
	})
	informCooldownAfterGuess: boolean;
}

class SettingsSetAutoStartOptions {
	@BooleanOption({
		name: 'value',
		description: 'Whether to automatically start a game after it ends.',
		required: true,
	})
	autoStart: boolean;
}

class SettingsSetMembersPrivilegeOptions {
	@BooleanOption({
		name: 'value',
		description: 'Whether server members can start games themselves.',
		required: true,
	})
	membersCanStart: boolean;
}

class SettingsSetStartAfterFirstGuessOptions {
	@BooleanOption({
		name: 'value',
		description: 'Whether to start the timer after the first guess',
		required: true,
	})
	startAfterFirstGuess: boolean;
}

const settingsResetOptionsChoices = [
	{
		name: 'Channel',
		value: 'channelId',
	},
	{
		name: 'Bot updates channel',
		value: 'botUpdatesChannelId',
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

class SettingsSetBotUpdatesChannelOptions {
	@ChannelOption({
		name: 'channel',
		description: 'The channel to send updates to.',
		required: true,
	})
	channel: TextChannel | undefined;
}

@UseGuards(ManageServerGuard)
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
		@Options() { channel }: SettingsSetChannelOptions
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
		description: 'Set channel for the bot updates',
		name: 'bot-updates',
	})
	public async setBotUpdatesChannel(
		@Context() [interaction]: SlashCommandContext,
		@Options() { channel }: SettingsSetBotUpdatesChannelOptions
	) {
		await this._settings.set(
			interaction.guildId,
			'botUpdatesChannelId',
			channel.id
		);

		return interaction.reply({
			content: `Koto will send it's updates to <#${channel.id}>!`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'ping-role',
		description: 'Set the ping role Koto will use to notify of a new game.',
	})
	public async setRole(
		@Context() [interaction]: SlashCommandContext,
		@Options() { role, onlyNew }: SettingsSetRoleOptions
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
		@Options() { setting }: SettingsResetOptions
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
			v => v.value === setting
		).name;

		return interaction.reply({
			content: `${name} has been reset to it's default value of \`${
				value ?? '-'
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
		@Options() { minutes }: SettingsSetFrequencyOrTimeLimitOptions
	) {
		const settings = await this._settings.getSettings(interaction.guildId);
		if (!minutes || Number.isNaN(minutes)) {
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
					timeLimitFormatted.hours && timeLimitFormatted.minutes ? ' & ' : ''
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
			}${frequencyFormatted.hours && frequencyFormatted.minutes ? ' & ' : ''}${
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
		@Options() { minutes }: SettingsSetFrequencyOrTimeLimitOptions
	) {
		const settings = await this._settings.getSettings(interaction.guildId);
		if (!minutes || Number.isNaN(minutes)) {
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
					frequencyFormatted.hours && frequencyFormatted.minutes ? ' & ' : ''
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
			}${timeLimitFormatted.hours && timeLimitFormatted.minutes ? ' & ' : ''}${
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
		@Options() { seconds }: SettingsSetCooldownOptions,
		@Context() [interaction]: SlashCommandContext
	) {
		if (Number.isNaN(seconds) || seconds === undefined || seconds === null) {
			return interaction.reply({
				content: 'A valid number for seconds must be provided.',
				ephemeral: true,
			});
		}

		if (seconds < 0 || seconds > 3600) {
			return interaction.reply({
				content: 'A minimum of 0 & a maximum of 3600 seconds must be provided.',
				ephemeral: true,
			});
		}

		await this._settings.set(interaction.guildId, 'cooldown', seconds);

		return interaction.reply({
			content: `Members will now be able to provide an answer every ${seconds} second${
				seconds === 1 ? '' : 's'
			}.`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'back-to-back-cooldown',
		description: 'Set the cooldown between answers of the same user.',
	})
	public async setBackToBackCooldown(
		@Options() { enabled, seconds }: SettingsSetBackToBackCooldownOptions,
		@Context() [interaction]: SlashCommandContext
	) {
		if (
			enabled &&
			(Number.isNaN(seconds) || seconds === undefined || seconds === null)
		) {
			return interaction.reply({
				content: 'A valid number for seconds must be provided.',
				ephemeral: true,
			});
		}

		if (seconds < 0 || seconds > 3600) {
			return interaction.reply({
				content: 'A minimum of 0 & a maximum of 3600 seconds must be provided.',
				ephemeral: true,
			});
		}

		await this._settings.set(
			interaction.guildId,
			'enableBackToBackCooldown',
			enabled
		);

		if (enabled) {
			await this._settings.set(
				interaction.guildId,
				'backToBackCooldown',
				seconds
			);
		}

		return interaction.reply({
			content: enabled
				? `Members will now be able to provide an answer every ${seconds} second${
						seconds === 1 ? '' : 's'
				  } back to back.`
				: 'Back to back cooldown has been disabled',
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'inform-cooldown',
		description:
			'Enable/Disable the message that informs a user of their cooldown after a guess.',
	})
	public async setInformCooldownAfterGuess(
		@Options()
		{ informCooldownAfterGuess }: SettingsSetInformCooldownAfterGuessOptions,
		@Context() [interaction]: SlashCommandContext
	) {
		await this._settings.set(
			interaction.guildId,
			'informCooldownAfterGuess',
			informCooldownAfterGuess
		);

		return interaction.reply({
			content: informCooldownAfterGuess
				? 'I will **automatically** inform a user of their cooldown after each guess.'
				: 'I will **not** inform a user of their cooldown after each guess.',
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'auto-start',
		description:
			'Whether a game should automatically start a new one after the previous ended.',
	})
	public async setAutoStart(
		@Context() [interaction]: SlashCommandContext,
		@Options() { autoStart }: SettingsSetAutoStartOptions
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
		description: 'Whether server members van start games themselves.',
	})
	public async setMemberCanStart(
		@Context() [interaction]: SlashCommandContext,
		@Options() { membersCanStart }: SettingsSetMembersPrivilegeOptions
	) {
		await this._settings.set(
			interaction.guildId,
			'membersCanStart',
			membersCanStart
		);

		return interaction.reply({
			content: `Members are **${
				membersCanStart ? '' : 'not '
			}allowed** to start games themselves.`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'start-after-first-guess',
		description:
			'Enable/Disable wether the timer should start after the first guess.',
	})
	public async setStartAfterFirstGuess(
		@Options()
		{ startAfterFirstGuess }: SettingsSetStartAfterFirstGuessOptions,
		@Context() [interaction]: SlashCommandContext
	) {
		await this._settings.set(
			interaction.guildId,
			'startAfterFirstGuess',
			startAfterFirstGuess
		);

		return interaction.reply({
			content: startAfterFirstGuess
				? 'I will start the timer **after** the first guess.'
				: 'I will start the timer immediately.',
			ephemeral: true,
		});
	}
}
