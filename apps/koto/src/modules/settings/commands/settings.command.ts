import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { Settings } from '@prisma/koto';
import { ForbiddenExceptionFilter, GuildAdminGuard } from '@yugen/shared';
import { ChannelType, Role, TextChannel } from 'discord.js';
import {
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
}

class SettingsSetFrequencyOptions {
	@NumberOption({
		name: 'hours',
		description: 'The amount of hours between games.',
		required: true,
		min_value: 1,
		max_value: 24,
	})
	hours: number | undefined;
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

const settingsResetOptionsChoices = [
	{
		name: 'Channel',
		value: 'channelId',
	},
	{
		name: 'Ping role',
		value: 'pingRoleId',
	},
	{
		name: 'Game frequency',
		value: 'frequency',
	},
	{
		name: 'Answer Cooldown',
		value: 'cooldown',
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
		@Options() { role }: SettingsSetRoleOptions,
	) {
		if (!role) {
			return interaction.reply({
				content: 'A role must be provided.',
				ephemeral: true,
			});
		}

		await this._settings.set(interaction.guildId, 'pingRoleId', role.id);

		return interaction.reply({
			content: `I will use <@&${role.id}> to notify members of a new game.`,
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

		if (setting === 'frequency') {
			value = 1;
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
		@Options() { hours }: SettingsSetFrequencyOptions,
	) {
		if (!hours || isNaN(hours)) {
			return interaction.reply({
				content: 'A valid number for hours must be provided.',
				ephemeral: true,
			});
		}

		if (hours < 1 || hours > 24) {
			return interaction.reply({
				content:
					'A minimum of 1 & a maximum of 24 hours must be provided.',
				ephemeral: true,
			});
		}

		await this._settings.set(interaction.guildId, 'frequency', hours);

		return interaction.reply({
			content: `I will start a new game every ${hours} hour${
				hours === 1 ? '' : 's'
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
		if (!minutes || isNaN(minutes)) {
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
}
