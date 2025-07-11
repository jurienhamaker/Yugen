import { Injectable, Logger } from '@nestjs/common';
import { Log } from '@prisma/hoshi';
import {
	ChannelType,
	Client,
	DiscordAPIError,
	EmbedBuilder,
	GuildEmoji,
	Message,
	MessageReaction,
} from 'discord.js';

import { EMBED_COLOR } from '../../../util/constants';
import { SettingsService } from '../../settings';

import { getUsername, resolveEmoji } from '@yugen/util';

import { PrismaService } from '@yugen/prisma/hoshi';

@Injectable()
export class StarboardService {
	private readonly _logger = new Logger(StarboardService.name);

	constructor(
		private _prisma: PrismaService,
		private _settings: SettingsService,
		private _client: Client
	) {}

	async checkReaction(reaction: MessageReaction) {
		const settings = await this._settings.getSettings(reaction.message.guildId);
		const { treshold, self, ignoredChannelIds } = settings;

		let sourceChannelId = reaction.message.channelId;
		const channelType = reaction.message.channel.type;
		if (
			channelType === ChannelType.PublicThread ||
			channelType === ChannelType.PrivateThread
		) {
			// in case of a thread, we will use the parent channelId
			sourceChannelId = reaction.message.channel.parentId;
		}

		if (ignoredChannelIds.includes(sourceChannelId)) {
			return;
		}

		this._logger.log(
			`Running starboard check for "${reaction.message.guildId}"`
		);

		const isStarboard = await this.getLogByMessageId(reaction.message.id);
		if (isStarboard) {
			return;
		}

		const reactionEmoji = reaction.emoji.id ?? reaction.emoji.name;
		const configurations = await this._prisma.starboards.findMany({
			where: {
				guildId: reaction.message.guildId,
				sourceEmoji: reactionEmoji,
				OR: [
					{
						sourceChannelId,
					},
					{
						sourceChannelId: null,
					},
				],
			},
		});

		if (configurations.length === 0) {
			return;
		}

		const configuration =
			configurations.find(c => c.sourceChannelId === sourceChannelId) ??
			configurations[0];

		const users = await reaction.users.fetch();
		const filteredUsers = users.filter(
			u => (self || u.id !== reaction.message.author.id) && !u.bot
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
				`Couldn't create embed for message ${reaction.message.id} for ${reaction.message.guildId}`
			);
			return;
		}

		if (log) {
			return this._updateStarboard(
				filteredUsers.size,
				embed,
				reaction.message as Message,
				configuration.sourceEmoji,
				log
			);
		}

		return this._createStarboard(
			filteredUsers.size,
			embed,
			reaction.message as Message,
			configuration.targetChannelId,
			configuration.sourceEmoji
		);
	}

	getLogByOriginalId(id: string) {
		return this._prisma.log.findUnique({
			where: {
				originalMessageId: id,
			},
		});
	}

	getLogByMessageId(id: string) {
		return this._prisma.log.findUnique({
			where: {
				messageId: id,
			},
		});
	}

	getStarboardBySourceId(guildId: string, sourceChannelId: string | null) {
		return this._prisma.starboards.findFirst({
			where: {
				guildId,
				sourceChannelId,
			},
		});
	}

	getStarboardBySourceIdAndEmoji(
		guildId: string,
		sourceEmoji: string | GuildEmoji,
		sourceChannelId: string | null
	) {
		return this._prisma.starboards.findFirst({
			where: {
				guildId,
				sourceChannelId,
				sourceEmoji: sourceEmoji.toString(),
			},
		});
	}

	async getStarboards(guildId: string, page = 1) {
		const where = {
			guildId,
		};

		const configurations = await this._prisma.starboards.findMany({
			where,
			skip: (page - 1) * 10,
			take: 10,
		});
		const total = await this._prisma.starboards.count({
			where,
		});

		return {
			configurations,
			total,
		};
	}

	addStarboard(
		guildId: string,
		sourceEmoji: string | GuildEmoji,
		sourceChannelId: string | null,
		targetChannelId: string
	) {
		return this._prisma.starboards.create({
			data: {
				guildId,
				sourceEmoji: sourceEmoji.toString(),
				sourceChannelId,
				targetChannelId,
			},
		});
	}

	async removeStarboardByID(guildId: string, id: number) {
		const configuration = await this._prisma.starboards.findFirst({
			where: {
				guildId,
				id,
			},
		});

		if (!configuration) {
			return null;
		}

		await this._prisma.starboards.delete({
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
		emoji: string
	) {
		const channel = await this._getStarboardChannel(starboardChannelId);

		const starboardMessage = await channel
			.send({
				content: this._createContentString(count, emoji, message),
				embeds: [embed],
			})
			.catch((error: DiscordAPIError) => {
				this._logger.error(
					`Couldn't create starboard message for ${message.guildId}/${message.channelId}/${message.id}: ${error.message}`,
					error.stack
				);
				return null;
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
		await message.react('🌟');
	}

	private async _updateStarboard(
		count: number,
		embed: EmbedBuilder,
		message: Message,
		emoji: string,
		log: Log
	) {
		const channel = await this._getStarboardChannel(log.channelId);
		const starboardMessage = await channel.messages
			.fetch(log.messageId)
			.catch((error: DiscordAPIError) => {
				this._logger.error(
					`Couldn't fetch starboard message for ${message.guildId}/${message.channelId}/${message.id} with target ${log.messageId}: ${error.message}`,
					error.stack
				);
				return null;
			});

		if (!starboardMessage) {
			return;
		}

		starboardMessage
			.edit({
				content: this._createContentString(count, emoji, message),
				embeds: [embed],
			})
			.catch((error: DiscordAPIError) => {
				this._logger.error(
					`Couldn't edit starboard message for ${message.guildId}/${message.channelId}/${message.id}: ${error.message}`,
					error.stack
				);
				return null;
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
		if (!message.content?.length && !message.attachments.first()?.url?.length) {
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

	private _createContentString(count: number, emoji: string, message: Message) {
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
