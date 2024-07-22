import { Injectable, Logger } from '@nestjs/common';
import { Game, GameStatus, GameType, Settings } from '@prisma/kusari';
import { PrismaService } from '@yugen/prisma/kusari';
import { getTimestamp, numberEmojis } from '@yugen/util';
import { addMinutes, subMinutes } from 'date-fns';
import { ChannelType, Client, Message } from 'discord.js';
import { SettingsService } from '../../settings';
import { GameDictionaryService } from './dictionary.service';
import { GamePointsService } from './points.service';
import { SavesService } from '../../../services/saves.service';

@Injectable()
export class GameService {
	private readonly _logger = new Logger(GameService.name);

	constructor(
		private _prisma: PrismaService,
		private _dictionary: GameDictionaryService,
		private _points: GamePointsService,
		private _saves: SavesService,
		private _settings: SettingsService,
		private _client: Client,
	) {}

	async start(
		guildId: string,
		type: GameType = GameType.NORMAL,
		recreate = false,
		letter?: string,
	) {
		this._logger.log(`Trying to start a game for ${guildId}`);

		const currentGame = await this.getCurrentGame(guildId);

		if (currentGame && !recreate) {
			return;
		}

		const channel = await this._settings.getConfiguredChannel(guildId);
		if (!channel) {
			return;
		}

		if (
			(currentGame && recreate) ||
			(currentGame && currentGame.type !== type)
		) {
			await this.endGame(currentGame.id, GameStatus.FAILED);
		}

		if (!letter) {
			letter = this._getRandomLetter();
		}

		await this._prisma.game.create({
			data: {
				guildId,
				type,
				history: {
					create: {
						word: letter,
						userId: this._client.user.id,
					},
				},
			},
		});

		if (channel.type === ChannelType.GuildText) {
			channel.send(`**A new game has started!**
The first letter is: **${letter.toUpperCase()}**`);
		}

		return true;
	}

	async addWord(
		guildId: string,
		word: string,
		message: Message,
		settings: Settings,
	) {
		const game = await this.getCurrentGame(guildId);

		if (!game) {
			return;
		}

		if (word.length < 3) {
			return this._doReply(
				message,
				`A word must be atleast 3 characters long, try again!`,
				'❌',
			);
		}

		const exists = await this._dictionary.checkDictionary(word);
		const lastWord = await this.getLastWord(game);
		const lastLetter = lastWord.word[lastWord.word.length - 1];

		if (
			lastWord.userId === message.author.id &&
			process.env['NODE_ENV'] === 'production'
		) {
			return this._doReply(
				message,
				`Sorry, but you can't add a word twice in a row! Please wait for another player to add a word.`,
				'🕒',
			);
		}

		const isLastLetter = word[0] === lastLetter;
		if (!exists || !isLastLetter) {
			const failReason = !exists
				? `Sorry, I couldn't find "**${word}**" in the [English dictionary](https://en.wiktionary.org/wiki/${word}), try again!`
				: `The word ${word} does not start with the letter **${lastLetter}**`;

			const saveAvailable = await this._getSaves(
				settings,
				message.author.id,
			);

			const count = await this._getCount(game.id);
			message.react('❌').catch(() => null);

			if (saveAvailable.player >= 1) {
				const { saves } = await this._saves.deductSave(
					message.author.id,
					1,
				);

				await this._settings.set(
					guildId,
					'savesUsed',
					settings.savesUsed + 1,
				);

				return message.reply(`${failReason}
Used **1 of your own** saves, You have **${saves}/2** saves left.`);
			}

			if (saveAvailable.guild >= 1) {
				const { saves, maxSaves } = await this._settings.deductSave(
					guildId,
					1,
				);

				await this._settings.set(
					guildId,
					'savesUsed',
					settings.savesUsed + 1,
				);

				return message.reply(`${failReason}
Used **1 server** save, There are **${saves}/${maxSaves}** server saves left.`);
			}

			const { isHighscore } = await this._checkStreak(
				settings,
				game,
				count,
			);

			await message.reply(
				`${failReason}
**The game has ended on a streak of ${count}!**${
					isHighscore
						? `
**A new highscore has been set! 🎉**`
						: ''
				}

**Want to save the game?** Make sure to **/vote** for Kusari and earn yourself saves to save the game!`,
			);

			return this.start(guildId, game.type, true);
		}

		const usedInPastHundred = await this._checkUsed(game, word);
		if (usedInPastHundred) {
			return this._doReply(
				message,
				`The word ${word} has already been used in the past 100 words, try another word!`,
				'❌',
			);
		}

		const cooldown = await this._checkCooldown(
			message.author.id,
			game.id,
			settings.cooldown,
		);
		if (cooldown) {
			return this._doReply(
				message,
				`You're on a cooldown, you can try again <t:${getTimestamp(
					cooldown,
				)}:R>`,
				'🕒',
			);
		}

		await this._points.addPointAndWord(guildId, message.author.id);
		await this._prisma.history.create({
			data: {
				word,
				userId: message.author.id,
				gameId: game.id,
			},
		});

		const count = await this._getCount(game.id);
		const { isHighscore, isGameHighscored } = await this._checkStreak(
			settings,
			game,
			count,
		);
		if (isGameHighscored) {
			await message.react('🎉').catch(() => null);
		}

		await message.react(isHighscore ? '☑️' : '✅').catch(() => null);

		this._setNumber(message, count);
	}

	async endGame(gameId: number, status: GameStatus = GameStatus.COMPLETED) {
		return this._prisma.game.update({
			where: {
				id: gameId,
			},
			data: {
				status,
			},
		});
	}

	getCurrentGame(guildId: string): Promise<Game> {
		return this._prisma.game.findFirst({
			where: {
				guildId,
				status: GameStatus.IN_PROGRESS,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	}

	async getLastWord(game: Game) {
		if (!game || game.status !== GameStatus.IN_PROGRESS) {
			return;
		}

		return this._prisma.history.findFirst({
			where: {
				gameId: game.id,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	}

	private async _getSaves(settings: Settings, userId: string) {
		const player = await this._saves.getPlayer(userId);

		return {
			guild: settings.saves,
			player: player.saves,
		};
	}

	private _getCount(gameId: number) {
		return this._prisma.history.count({
			where: {
				gameId,
				userId: {
					not: this._client.user.id,
				},
			},
		});
	}

	private async _checkStreak(settings: Settings, game: Game, count: number) {
		let isHighscore = false;
		let isGameHighscored = false;
		if (count > settings.highscore) {
			isHighscore = true;
			await this._settings.set(settings.guildId, 'highscore', count);
			await this._settings.set(
				settings.guildId,
				'highscoreDate',
				new Date(),
			);

			if (!game.isHighscored) {
				isGameHighscored = true;
				await this._prisma.game.update({
					where: {
						id: game.id,
					},
					data: {
						isHighscored: true,
					},
				});
			}
		}

		return { isHighscore, isGameHighscored };
	}

	private async _setNumber(message: Message, count: number) {
		const stringCount = `${count}`;

		const usedEmojis = [];
		for (const number of stringCount) {
			const available = numberEmojis[parseInt(number)];
			for (const emoji of available) {
				if (usedEmojis.includes(emoji)) {
					continue;
				}

				usedEmojis.push(emoji);
				await message.react(emoji).catch(() => null);
				break;
			}
		}
	}

	private async _checkCooldown(
		userId: string,
		gameId: number,
		cooldown: number,
	): Promise<Date | undefined> {
		if (process.env['NODE_ENV'] !== 'production') {
			return;
		}

		const lastGuessWithinCooldown = await this._prisma.history.findFirst({
			where: {
				userId,
				gameId,
				createdAt: {
					gt: subMinutes(new Date(), cooldown),
				},
			},
			select: {
				createdAt: true,
			},
		});

		if (!lastGuessWithinCooldown) {
			return;
		}

		return addMinutes(lastGuessWithinCooldown.createdAt, cooldown);
	}

	private async _checkUsed(game: Game, word: string) {
		const history = await this._prisma.history.findMany({
			where: {
				gameId: game.id,
			},
			take: 100,
			orderBy: {
				createdAt: 'desc',
			},
		});

		const index = history.findIndex((t) => t.word === word);
		return index >= 0;
	}

	private async _doReply(message: Message, reply: string, reaction?: string) {
		if (reaction) {
			message.react(reaction).catch(() => null);
		}

		const response = await message.reply(reply).catch(() => null);
		if (response) {
			setTimeout(() => response.delete().catch(() => null), 5000);
		}
		return;
	}

	private _getRandomLetter() {
		const letters = [
			'a',
			'b',
			'c',
			'd',
			'e',
			'f',
			'g',
			'h',
			'i',
			'j',
			'k',
			'l',
			'm',
			'n',
			'o',
			'p',
			'q',
			'r',
			's',
			't',
			'u',
			'v',
			'w',
			'y',
			'z',
		];
		const weights = [
			382, 963, 1276, 1351, 1411, 1493, 1544, 1603, 1637, 1647, 1657,
			1730, 1801, 1828, 1858, 1970, 1975, 2077, 2286, 2387, 2408, 2443,
			2493, 2503, 2513,
		];

		const maxCumulativeWeight = weights[weights.length - 1];
		const randomNumber = maxCumulativeWeight * Math.random();

		const index = weights.findIndex((v) => v >= randomNumber);

		return letters[index];
	}
}
