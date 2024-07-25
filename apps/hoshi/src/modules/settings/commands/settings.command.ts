import { Injectable, Logger, UseFilters, UseGuards } from '@nestjs/common';
import { Settings } from '@prisma/hoshi';
import {
	ForbiddenExceptionFilter,
	ManageServerGuard,
	GuildModeratorGuard,
} from '@yugen/shared';
import { TextChannel } from 'discord.js';
import {
	BooleanOption,
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
import { SETTINGS_CHOICES } from '../util/constants';

class SettingsResetOptions {
	@StringOption({
		name: 'setting',
		description: "The setting to reset to it's default value.",
		required: true,
		choices: SETTINGS_CHOICES,
	})
	setting: keyof Settings;
}

class IgnoreOptions {
	@ChannelOption({
		name: 'channel',
		description: 'The channel to ignore/unignore',
		required: false,
	})
	channel: TextChannel | undefined;
}

class SetTresholdOptions {
	@NumberOption({
		name: 'treshold',
		description: 'The treshold to set to',
		required: true,
	})
	treshold: string;
}

class SetSelfOptions {
	@BooleanOption({
		name: 'allowed',
		description:
			'Whether message authors are allowed to star their own message',
		required: true,
	})
	self: boolean;
}

class SetBotUpdatesChannelOptions {
	@ChannelOption({
		name: 'channel',
		description: 'The channel to send updates to.',
		required: true,
	})
	channel: TextChannel | undefined;
}

@UseFilters(ForbiddenExceptionFilter)
@SettingsCommandDecorator()
@Injectable()
export class SettingsCommands {
	private readonly _logger = new Logger(SettingsCommands.name);

	constructor(private _settings: SettingsService) {}

	@UseGuards(GuildModeratorGuard)
	@Subcommand({
		name: 'show',
		description: 'Show the current settings',
	})
	public show(@Context() [interaction]: SlashCommandContext) {
		return this._settings.showSettings(interaction);
	}

	@UseGuards(ManageServerGuard)
	@Subcommand({
		description: "Reset a hoshi setting to it's default value.",
		name: 'reset',
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

		if (setting === 'treshold') {
			value = 3;
		}

		if (setting === 'ignoredChannelIds') {
			value = [];
		}

		if (setting === 'self') {
			value = false;
		}

		await this._settings.set(interaction.guildId, setting, value);

		const name = SETTINGS_CHOICES.find((v) => v.value === setting).name;

		return interaction.reply({
			content: `${name} has been reset to it's default value of \`${
				value ? value : '-'
			}\``,
			ephemeral: true,
		});
	}

	@UseGuards(ManageServerGuard)
	@Subcommand({
		description: 'Set starboard threshold',
		name: 'treshold',
	})
	public async setTreshold(
		@Context() [interaction]: SlashCommandContext,
		@Options() { treshold }: SetTresholdOptions,
	) {
		const parsed = parseInt(treshold, 10);

		if (isNaN(parsed) || parsed < 1) {
			return interaction.reply({
				content: `Treshold must be atleast 1.`,
				ephemeral: true,
			});
		}

		await this._settings.set(interaction.guildId!, 'treshold', parsed);

		return interaction.reply({
			content: `Starboard treshold has been set to **${parsed}**.`,
			ephemeral: true,
		});
	}

	@UseGuards(ManageServerGuard)
	@Subcommand({
		name: 'author-starring',
		description: 'Set whether message author starring counts',
	})
	public async setSelf(
		@Context() [interaction]: SlashCommandContext,
		@Options() { self }: SetSelfOptions,
	) {
		await this._settings.set(interaction.guildId!, 'self', self);

		return interaction.reply({
			content: `Message authors are now **${
				self ? 'allowed' : 'disallowed'
			}** to star their own message.`,
			ephemeral: true,
		});
	}

	@UseGuards(ManageServerGuard)
	@Subcommand({
		description: 'Set channel for the bot updates',
		name: 'bot-updates',
	})
	public async setBotUpdatesChannel(
		@Context() [interaction]: SlashCommandContext,
		@Options() { channel }: SetBotUpdatesChannelOptions,
	) {
		await this._settings.set(
			interaction.guildId!,
			'botUpdatesChannelId',
			channel.id,
		);

		return interaction.reply({
			content: `Hoshi will send it's updates to <#${channel.id}>!`,
			ephemeral: true,
		});
	}

	@UseGuards(GuildModeratorGuard)
	@Subcommand({
		name: 'ignore',
		description: 'Ignore the current channel',
	})
	public async ignore(
		@Context() [interaction]: SlashCommandContext,
		@Options() { channel }: IgnoreOptions,
	) {
		this._logger.verbose(
			`Ignoring starboard channel for ${interaction.guildId} - ${
				channel?.id ?? interaction.channelId
			}`,
		);

		await this._settings.ignoreChannel(
			interaction.guildId,
			channel?.id ?? interaction.channelId,
			true,
		);

		return interaction.reply({
			content: `Starboard are now **ignored** for ${
				channel?.id ? `<#${channel.id}>` : 'this channel'
			}!`,
			ephemeral: true,
		});
	}

	@UseGuards(GuildModeratorGuard)
	@Subcommand({
		name: 'unignore',
		description: 'Unignore the current channel',
	})
	public async unignore(
		@Context() [interaction]: SlashCommandContext,
		@Options() { channel }: IgnoreOptions,
	) {
		this._logger.verbose(
			`Unignoring starboard channel for ${interaction.guildId} - ${
				channel?.id ?? interaction.channelId
			}`,
		);

		await this._settings.ignoreChannel(
			interaction.guildId,
			channel?.id ?? interaction.channelId,
			false,
		);

		return interaction.reply({
			content: `Starboards are now **unignored** for ${
				channel?.id ? `<#${channel.id}>` : 'this channel'
			}!`,
			ephemeral: true,
		});
	}
}
