import { Injectable, Logger } from '@nestjs/common';
import { Game, GameStatus, GameType, Settings } from '@prisma/kusari';
import { PrismaService } from '@yugen/prisma/kusari';
import { getTimestamp } from '@yugen/util';
import { addMinutes, subMinutes } from 'date-fns';
import { Message } from 'discord.js';
import { GameDictionaryService } from './dictionary.service';
import { GamePointsService } from './points.service';

@Injectable()
export class GameService {
	private readonly _logger = new Logger(GameService.name);

	constructor(
		private _prisma: PrismaService,
		private _dictionary: GameDictionaryService,
		private _points: GamePointsService,
	) {}

	async start(
		guildId: string,
		type: GameType = GameType.NORMAL,
		recreate = false,
	) {
		this._logger.log(`Trying to start a game for ${guildId}`);

		const currentGame = await this.getCurrentGame(guildId);

		if (currentGame && !recreate) {
			return;
		}

		if (
			(currentGame && recreate) ||
			(currentGame && currentGame.type !== type)
		) {
			await this.endGame(currentGame.id, GameStatus.FAILED);
		}

		await this._prisma.game.create({
			data: {
				guildId,
				type,
			},
		});

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
				`A word must be atleast 3 characters long.`,
				'❌',
			);
		}

		const exists = await this._dictionary.checkDictionary(word);

		if (!exists) {
			return this._doReply(
				message,
				`Sorry, I couldn't find "**${word}**" in the english dictionary.`,
				'❌',
			);
		}

		const lastWord = await this._lastWord(game);
		if (lastWord) {
			if (
				lastWord.userId === message.author.id &&
				process.env.NODE_ENV === 'production'
			) {
				return this._doReply(
					message,
					`Sorry, but you can't add a word twice in a row! Please wait for another player to add a word.`,
					'🕒',
				);
			}

			const lastLetter = lastWord.word[lastWord.word.length - 1];
			if (word[0] !== lastLetter) {
				return this._doReply(
					message,
					`The word ${word} does not start with the letter **${lastLetter}**`,
					'❌',
				);
			}
		}

		const usedInPastHundred = await this._checkUsed(game, word);
		if (usedInPastHundred) {
			return this._doReply(
				message,
				`The word ${word} has already been used in the past 100 words.`,
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

		await message.react('✅');

		await this._points.addPointAndWord(guildId, message.author.id);
		await this._prisma.history.create({
			data: {
				word,
				userId: message.author.id,
				gameId: game.id,
			},
		});
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

	private async _checkCooldown(
		userId: string,
		gameId: number,
		cooldown: number,
	): Promise<Date | undefined> {
		if (process.env.NODE_ENV !== 'production') {
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

	private async _lastWord(game: Game) {
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
			message.react(reaction);
		}

		const response = await message.reply(reply).catch(() => null);
		if (response) {
			setTimeout(() => response.delete().catch(() => null), 5000);
		}
		return;
	}
}
