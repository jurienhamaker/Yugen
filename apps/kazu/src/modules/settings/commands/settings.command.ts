import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { Settings } from '@prisma/kazu';
import { ForbiddenExceptionFilter, ManageServerGuard } from '@yugen/shared';
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
		description: 'The channel Kazu will run in.',
		required: true,
	})
	channel: TextChannel | undefined;
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
		name: 'Cooldown',
		value: 'cooldown',
	},
	{
		name: 'Math',
		value: 'math',
	},
	{
		name: 'Shame role',
		value: 'shameRoleId',
	},
	{
		name: 'Remove shame role after highschore',
		value: 'removeShameRoleAfterHighscore',
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

class SettingsSetMathOptions {
	@BooleanOption({
		name: 'enabled',
		description: 'Wether Kazu will try to parse math.',
		required: true,
	})
	enabled: boolean;
}

class SettingsSetShameRoleOptions {
	@RoleOption({
		name: 'role',
		description: 'The role Kazu will apply on failure.',
		required: true,
	})
	role: Role;
}

class SettingsSetRemoveShameRoleAfterHighscoreOptions {
	@BooleanOption({
		name: 'remove',
		description:
			'Wether Kazu will remove the shame role when a highscore is reached.',
		required: true,
	})
	remove: boolean;
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
		description: 'Set the channel Kazu will run in.',
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
		description: 'Set channel for the bot updates',
		name: 'bot-updates',
	})
	public async setBotUpdatesChannel(
		@Context() [interaction]: SlashCommandContext,
		@Options() { channel }: SettingsSetBotUpdatesChannelOptions,
	) {
		await this._settings.set(
			interaction.guildId!,
			'botUpdatesChannelId',
			channel.id,
		);

		return interaction.reply({
			content: `Kazu will send it's updates to <#${channel.id}>!`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'reset',
		description: "Reset a Kazu setting to it's default value.",
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
			value = 2;
		}

		if (setting === 'math') {
			value = true;
		}

		if (setting === 'removeShameRoleAfterHighscore') {
			value = false;
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
			content: `Members will now be able to provide a word every ${minutes} minute${
				minutes === 1 ? '' : 's'
			}.`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'math',
		description: 'Set wether Kazu will try to parse math.',
	})
	public async setMath(
		@Context() [interaction]: SlashCommandContext,
		@Options() { enabled }: SettingsSetMathOptions,
	) {
		await this._settings.set(interaction.guildId, 'math', enabled);

		return interaction.reply({
			content: `I **${
				enabled ? 'enabled' : 'disabled'
			}** math from being parsed.`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'shame-role',
		description: 'Set shame role Kazu will apply on failure.',
	})
	public async setShameRole(
		@Context() [interaction]: SlashCommandContext,
		@Options() { role }: SettingsSetShameRoleOptions,
	) {
		await this._settings.set(interaction.guildId, 'shameRoleId', role.id);

		return interaction.reply({
			content: `I will apply <@&${role.id}> to the person that breaks the count chain.`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'remove-shame-role',
		description:
			'Set wether Kazu will reset the shame role after a highscore is reached.',
	})
	public async setResetShameRoleAfterHighscore(
		@Context() [interaction]: SlashCommandContext,
		@Options() { remove }: SettingsSetRemoveShameRoleAfterHighscoreOptions,
	) {
		await this._settings.set(
			interaction.guildId,
			'removeShameRoleAfterHighscore',
			remove,
		);

		return interaction.reply({
			content: `I will **${
				remove ? 'remove' : 'not remove'
			}** the shame role after a highscore is reached.`,
			ephemeral: true,
		});
	}
}
