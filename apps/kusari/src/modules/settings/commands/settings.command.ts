import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { Settings } from '@prisma/kusari';
import { ForbiddenExceptionFilter, ManageServerGuard } from '@yugen/shared';
import { ChannelType, TextChannel } from 'discord.js';
import {
	ChannelOption,
	Context,
	NumberOption,
	Options,
	SlashCommandContext,
	StringOption,
	Subcommand,
} from 'necord';
import { SettingsService } from '../services';
import { SettingsCommandDecorator } from '../settings.decorator';

class SettingsSetChannelOptions {
	@ChannelOption({
		name: 'channel',
		description: 'The channel Kusari will run in.',
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
		description: 'Set the channel Kusari will run in.',
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
			content: `Kusari will send it's updates to <#${channel.id}>!`,
			ephemeral: true,
		});
	}

	@Subcommand({
		name: 'reset',
		description: "Reset a Kusari setting to it's default value.",
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
}
