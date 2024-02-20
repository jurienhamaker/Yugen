import { Injectable, Logger } from '@nestjs/common';
import {
	ChannelType,
	Client,
	EmbedBuilder,
	Message,
	MessageReaction,
} from 'discord.js';
import { SettingsService } from '../../settings';
import { PrismaService } from '@yugen/prisma/hoshi';
import { Log } from '@prisma/hoshi';
import { getUsername, resolveEmoji } from '@yugen/util';
import { EMBED_COLOR } from '../../../util/constants';

@Injectable()
export class StarboardService {
	private readonly _logger = new Logger(StarboardService.name);

	constructor(
		private _prisma: PrismaService,
		private _settings: SettingsService,
		private _client: Client,
	) {}

	async checkReaction(reaction: MessageReaction) {
		const settings = await this._settings.getSettings(
			reaction.message.guildId,
		);
		const { enabled, emoji, treshold, self, ignoredChannelIds } = settings;

		let { channelId } = settings;

		if (!enabled) {
			return;
		}

		if (ignoredChannelIds.includes(reaction.message.channelId)) {
			return;
		}

		this._logger.log(
			`Running starboard check for "${reaction.message.guildId}"`,
		);

		const reactionEmoji = reaction.emoji.id ?? reaction.emoji.name;

		if (reactionEmoji !== emoji) {
			return;
		}

		const users = await reaction.users.fetch();
		const filteredUsers = users.filter(
			(u) => (self || u.id !== reaction.message.author.id) && !u.bot,
		);
		const log = await this.getLogByOriginalId(reaction.message.id);

		if (filteredUsers.size === 0 && log) {
			return this._deleteStarboard(log);
		}

		if (filteredUsers.size < treshold) {
			return;
		}

		const embed = this._createEmbed(reaction.message as Message);

		if (!embed) {
			this._logger.warn(
				`Couldn't create embed for message ${reaction.message.id} for ${reaction.message.guildId}`,
			);
			return;
		}

		if (log) {
			return this._updateStarboard(
				filteredUsers.size,
				embed,
				reaction.message as Message,
				emoji,
				log,
			);
		}

		const configuration = await this._prisma.specificChannels.findFirst({
			where: {
				guildId: reaction.message.guildId,
				sourceChannelId: reaction.message.channel.id,
			},
		});
		if (configuration) {
			channelId = configuration.channelId;
		}

		return this._createStarboard(
			filteredUsers.size,
			embed,
			reaction.message as Message,
			channelId,
			emoji,
		);
	}

	getLogByOriginalId(id: string) {
		return this._prisma.log.findUnique({
			where: {
				originalMessageId: id,
			},
		});
	}

	async getSpecificChannels(guildId: string, page = 1) {
		const where = {
			guildId,
		};

		const configurations = await this._prisma.specificChannels.findMany({
			where,
			skip: (page - 1) * 10,
			take: 10,
		});
		const total = await this._prisma.specificChannels.count({
			where,
		});

		return {
			configurations,
			total,
		};
	}

	addSpecificChannel(
		guildId: string,
		sourceChannelId: string,
		channelId: string,
	) {
		return this._prisma.specificChannels.create({
			data: {
				guildId,
				sourceChannelId,
				channelId,
			},
		});
	}

	async removeSpecificChannelByID(guildId: string, id: number) {
		const configuration = await this._prisma.specificChannels.findFirst({
			where: {
				guildId,
				id,
			},
		});

		if (!configuration) {
			return null;
		}

		await this._prisma.specificChannels.delete({
			where: {
				id: configuration.id,
			},
		});

		return configuration;
	}

	private async _createStarboard(
		count: number,
		embed: EmbedBuilder,
		message: Message,
		starboardChannelId: string,
		emoji: string,
	) {
		const channel = await this._getStarboardChannel(starboardChannelId);

		const starboardMessage = await channel.send({
			content: this._createContentString(count, emoji, message),
			embeds: [embed],
		});

		await this._prisma.log.create({
			data: {
				messageId: starboardMessage.id,
				originalMessageId: message.id,
				guildId: starboardMessage.guildId,
				channelId: starboardChannelId,
			},
		});

		await starboardMessage.react(emoji);
	}

	private async _updateStarboard(
		count: number,
		embed: EmbedBuilder,
		message: Message,
		emoji: string,
		log: Log,
	) {
		const channel = await this._getStarboardChannel(log.channelId);
		const starboardMessage = await channel.messages.fetch(log.messageId);

		if (!starboardMessage) {
			return;
		}

		starboardMessage.edit({
			content: this._createContentString(count, emoji, message),
			embeds: [embed],
		});
	}

	private async _deleteStarboard(log: Log) {
		const channel = await this._getStarboardChannel(log.channelId);
		const starboardMessage = await channel.messages.fetch(log.messageId);

		if (!starboardMessage) {
			return;
		}

		await starboardMessage.delete().catch(() => null);
		await this._prisma.log.delete({
			where: {
				messageId: starboardMessage.id,
			},
		});
	}

	private async _getStarboardChannel(starboardChannelId: string) {
		const channel = await this._client.channels.fetch(starboardChannelId);

		if (!channel) {
			return;
		}

		if (channel.type !== ChannelType.GuildText) {
			return;
		}

		return channel;
	}

	private _createEmbed(message: Message) {
		if (
			!message.content?.length &&
			!message.attachments.first()?.url?.length
		) {
			return;
		}

		let embed = new EmbedBuilder()
			.setAuthor({
				name: `${getUsername(message.author)}`,
				iconURL: message.author.displayAvatarURL() || undefined,
			})
			.setColor(EMBED_COLOR)
			.setTimestamp();

		if (message.content?.length) {
			embed = embed.setDescription(message.content);
		}

		if (message.attachments.first()?.url?.length) {
			embed = embed.setImage(message.attachments.first()?.url);
		}

		return embed;
	}

	private _createContentString(
		count: number,
		emoji: string,
		message: Message,
	) {
		const {
			emoji: resolvedEmoji,
			clientEmoji,
			unicode,
		} = resolveEmoji(emoji, this._client);

		return `**${count} ${
			unicode ? resolvedEmoji : clientEmoji
		}** at https://discord.com/channels/${message.guildId}/${
			message.channelId
		}/${message.id}`;
	}
}
