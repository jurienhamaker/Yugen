import { Injectable, Logger, UseFilters, UseGuards } from '@nestjs/common';
import { Settings } from '@prisma/hoshi';
import {
	ForbiddenExceptionFilter,
	GuildAdminGuard,
	GuildModeratorGuard,
} from '@yugen/shared';
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
import { ChannelType, TextChannel } from 'discord.js';
import { resolveEmoji } from '@yugen/util';

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

class SetEmojiOptions {
	@StringOption({
		name: 'emoji',
		description: 'The emoji to react with',
		required: true,
	})
	emojiString: string;
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
			'Wether message authors are allowed to star their own message',
		required: true,
	})
	self: boolean;
}

class SetChannelOptions {
	@ChannelOption({
		name: 'channel',
		description: 'The default channel for the starboard.',
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

	@UseGuards(GuildAdminGuard)
	@Subcommand({
		name: 'reset',
		description: "Reset a hoshi setting to it's default value.",
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

		if (setting === 'emoji') {
			value = '⭐';
		}

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

	@UseGuards(GuildAdminGuard)
	@Subcommand({
		name: 'emoji',
		description: 'Show starboard settings',
	})
	public async setEmoji(
		@Context() [interaction]: SlashCommandContext,
		@Options() { emojiString }: SetEmojiOptions,
	) {
		const resolved = resolveEmoji(emojiString, interaction.client);
		const { found, unicode } = resolved;

		if (!found) {
			return interaction.reply({
				content: `You can only use emojis from guilds that the bot is in.`,
				ephemeral: true,
			});
		}

		const { emoji, clientEmoji } = resolved;

		await this._settings.set(interaction.guildId!, 'emoji', emoji);

		return interaction.reply({
			content: `Starboard reaction emoji has been set to ${
				unicode ? emoji : clientEmoji
			}.`,
			ephemeral: true,
		});
	}

	@UseGuards(GuildAdminGuard)
	@Subcommand({
		name: 'treshold',
		description: 'Set starboard threshold',
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

	@UseGuards(GuildAdminGuard)
	@Subcommand({
		name: 'author-starring',
		description: 'Set wether message author starring counts',
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

	@UseGuards(GuildAdminGuard)
	@Subcommand({
		name: 'channel',
		description: 'Set the default starboard channel',
	})
	public async setChannel(
		@Context() [interaction]: SlashCommandContext,
		@Options() { channel }: SetChannelOptions,
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