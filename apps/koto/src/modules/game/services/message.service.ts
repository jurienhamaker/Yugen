import { Injectable, Logger } from '@nestjs/common';
import { Game, GameStatus, Guess } from '@prisma/koto';
import { getYear } from 'date-fns';
import { Channel, ChannelType, Client, EmbedBuilder } from 'discord.js';

import { GameTypeEmojiColorMap, getEmoji } from '../../../util/get-emoji';
import { asciiNumbers } from '../../../util/numbers';
import { SettingsService } from '../../settings';
import { GAME_TYPE, GameMeta, GameWithMetaAndGuesses } from '../types/meta';

import { getEmbedFooter, getTimestamp } from '@yugen/util';

import { PrismaService } from '@yugen/prisma/koto';

@Injectable()
export class GameMessageService {
	private readonly _logger = new Logger(GameMessageService.name);

	constructor(
		private _prisma: PrismaService,
		private _settings: SettingsService,
		private _client: Client
	) {}

	async create(game: GameWithMetaAndGuesses, isNew = false) {
		const settings = await this._settings.getSettings(game.guildId);

		if (!settings.channelId) {
			return;
		}

		this._logger.debug(
			`Creating message for game ${game.id}${isNew ? ' (new)' : ''}`
		);
		const channel = await this._client.channels.fetch(settings.channelId);
		if (game.lastMessageId) {
			this._delete(channel, game.lastMessageId).catch(error =>
				this._logger.error(error)
			);
		}

		if (!channel || channel.type !== ChannelType.GuildText) {
			this._logger.debug(
				`Channel is not of type text for guild ${game.guildId}`
			);
			return;
		}

		const embed = await this._createEmbed(game);
		const message = await channel
			.send({
				content:
					settings.pingRoleId && (isNew || !settings.pingOnlyNew)
						? `<@&${settings.pingRoleId}>`
						: '',
				embeds: [embed],
				allowedMentions: {
					users: [],
					roles: [settings.pingRoleId],
				},
			})
			.catch((error: Error) => {
				if (error.message?.includes('Missing Permissions')) {
					this._logger.debug(
						`No permissions to send message in guild ${game.guildId} on channel ${settings.channelId}`
					);
					return;
				}

				this._logger.debug(
					`Something wen't wrong while creating the message for game ${
						game.id
					}${isNew ? ' (new)' : ''}: ${error.message}`,
					error
				);

				throw error;
			});

		if (!message) {
			return;
		}

		const updatedGame = await this._prisma.game.update({
			where: {
				id: game.id,
			},
			data: {
				lastMessageId: message.id,
			},
		});

		return updatedGame;
	}

	private async _delete(channel: Channel, messageId: string) {
		if (!channel || channel.type !== ChannelType.GuildText) {
			return;
		}

		const message = await channel.messages.fetch(messageId);
		if (!message) {
			return;
		}

		return message.delete().catch(() => null);
	}

	private async _createEmbed(
		game: Game & { guesses: Guess[]; meta: GameMeta }
	) {
		const footer = await getEmbedFooter(this._client);

		return new EmbedBuilder()
			.setTitle(`Koto #${game.number}`)
			.setColor(this._getEmbedColor(game.status))
			.setDescription(
				`${this._getMessageRows(game.guesses, game.status)}
${this._getMessageKeyboard(game)}
${this._getGameInformation(game)}`
			)
			.setFooter(footer);
	}

	private _getEmbedColor(status: GameStatus) {
		switch (status) {
			case GameStatus.COMPLETED: {
				return '#64e090';
			}
			case GameStatus.FAILED:
			case GameStatus.OUT_OF_TIME: {
				return '#e06060';
			}
			default: {
				return '#66c5d6';
			}
		}
	}

	private _getMessageRows(
		guesses: Guess[],
		status: GameStatus = GameStatus.IN_PROGRESS
	) {
		const rows = guesses.map(guess => ({
			meta: guess.meta,
			userId: guess.userId,
			points: guess.points,
			createdAt: guess.createdAt,
		}));

		const receivedBonus = [];

		if (rows.length < 9 && status === GameStatus.IN_PROGRESS) {
			for (let index = 9 - rows.length; index != 0; index--) {
				const meta = {};

				const letters = Array.from({ length: 6 }).fill({
					letter: 'blank',
					type: GAME_TYPE.DEFAULT,
				});

				for (const i in letters) {
					meta[i] = letters[i];
				}

				rows.push({
					meta,
					userId: this._client.user.id,
					points: 0,
					createdAt: new Date(),
				});
			}
		}

		const rowsSorted = rows.sort(
			(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
		);

		let rowStr = '';

		for (const [i, row] of rowsSorted.entries()) {
			rowStr +=
				`${asciiNumbers[i + 1]}` +
				Object.keys(row.meta)
					.map(key =>
						getEmoji(
							GameTypeEmojiColorMap[row.meta[key].type],
							row.meta[key].letter
						)
					)
					.join('') +
				`${
					row.userId === this._client.user.id
						? ''
						: ` <@${row.userId}> **+${row.points}${
								status === GameStatus.COMPLETED &&
								!receivedBonus.includes(row.userId)
									? ' (+2)'
									: ''
						  }**`
				}` +
				'\n';

			receivedBonus.push(row.userId);
		}

		return rowStr;
	}

	private _getMessageKeyboard(game: GameWithMetaAndGuesses) {
		const rows = [
			['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
			['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', null],
			[null, 'z', 'x', 'c', 'v', 'b', 'n', 'm', null],
		];

		let rowStr = '';

		for (const row of rows) {
			rowStr +=
				row
					.map(l =>
						l === null
							? getEmoji('GRAY', 'blank')
							: getEmoji(
									GameTypeEmojiColorMap[game.meta.keyboard?.[l] ?? 'DEFAULT'],
									l
							  )
					)
					.join('') + '\n';
		}

		return rowStr;
	}

	private _getGameInformation(game: GameWithMetaAndGuesses) {
		const footer = `Don't know how to play? Use the /tutorial commands for detailed instructions.${
			process.env['NODE_ENV'] === 'production'
				? ''
				: `\nDevelopment mode: **${game.word}**`
		}`;
		const nextKoto = `Next koto <t:${getTimestamp(game.endingAt)}:R>`;

		switch (game.status) {
			case GameStatus.COMPLETED: {
				return `
Good job! Everyone who participated gets **+2** points!
${nextKoto}

${footer}`;
			}
			case GameStatus.FAILED: {
				return `
Out of guesses, The correct word was **${game.word.toUpperCase()}**!
${nextKoto}

${footer}`;
			}
			case GameStatus.OUT_OF_TIME: {
				return `
Time's up! The correct word was **${game.word.toUpperCase()}**!

${footer}`;
			}
			default: {
				return `
${9 - game.guesses.length} guesses remaining
${
	getYear(game.endingAt) === 3000 // don't show it yet
		? `Timer will start after first guess`
		: `Time runs out <t:${getTimestamp(game.endingAt)}:R>`
}

${footer}`;
			}
		}
	}
}
