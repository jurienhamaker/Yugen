import { Injectable, Logger } from '@nestjs/common';
import { Game, GameStatus, Guess, Settings } from '@prisma/koto';
import { SettingsService } from '@yugen/koto/modules/settings';
import { WordsService } from '../../words/services/words.service';
import { PrismaService } from '@yugen/prisma/koto';
import { getTimestamp } from '@yugen/util';
import { addMinutes, subMinutes } from 'date-fns';
import { Message } from 'discord.js';
import {
	GAME_TYPE,
	GameGuessMeta,
	GameMeta,
	GameWithMetaAndGuesses,
} from '../types/meta';
import { GameMessageService } from './message.service';
import { GamePointsService } from './points.service';

@Injectable()
export class GameService {
	private readonly _logger = new Logger(GameService.name);

	constructor(
		private _prisma: PrismaService,
		private _settings: SettingsService,
		private _words: WordsService,
		private _message: GameMessageService,
		private _points: GamePointsService,
	) {}

	async start(
		guildId: string,
		schedule = false,
		recreate = false,
		word = null,
	) {
		this._logger.log(`Trying to start a game for ${guildId}`);

		const currentGame = await this.getCurrentGame(guildId);

		if (currentGame && !recreate) {
			return;
		}

		if (currentGame && recreate) {
			await this.endGame(currentGame.id, GameStatus.FAILED);
		}

		const pastFiftyGames = await this._prisma.game.findMany({
			where: {
				guildId,
			},
			select: {
				word: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 50,
		});

		const ignoredWords = pastFiftyGames.map((g) => g.word);
		word = word ?? this._words.getRandom(ignoredWords);

		if (!word) {
			return;
		}

		const settings = await this._settings.getSettings(guildId);
		const game = await this._prisma.game.create({
			data: {
				guildId,
				word,
				scheduleStarted: schedule,
				endingAt: addMinutes(new Date(), settings.timeLimit),
				meta: this._createBaseState(word) as any,
			},
			include: {
				guesses: true,
			},
		});

		await this._message.create(game as GameWithMetaAndGuesses, true);
		return true;
	}

	async guess(
		guildId: string,
		word: string,
		message: Message,
		settings: Settings,
	) {
		let game = await this.getCurrentGame(guildId);
		await this._points.getPlayer(guildId, message.author.id);

		if (!game) {
			return;
		}

		const alreadyGuessedIndex = game.guesses.findIndex(
			(g) => g.word === word,
		);

		if (alreadyGuessedIndex >= 0 && process.env.NODE_ENV === 'production') {
			await message.react('❌');
			return;
		}

		const cooldown = await this._checkCooldown(
			message.author.id,
			game.id,
			settings.cooldown,
		);
		if (cooldown) {
			message.react('🕒');
			message.reply(
				`You're on a cooldown, you can guess again <t:${getTimestamp(
					cooldown,
				)}:R>`,
			);
			return;
		}

		const { meta, guessed, points, gameMeta } = this._checkWord(
			game.word,
			word,
			game.meta as any,
		);

		await this._prisma.guess.create({
			data: {
				game: {
					connect: { id: game.id },
				},
				points,
				userId: message.author.id,
				word,
				meta: meta as any,
			},
		});

		let status = guessed ? GameStatus.COMPLETED : game.status;
		if (game.guesses.length + 1 === 9 && !guessed) {
			status = GameStatus.FAILED;
		}

		game = await this._prisma.game.update({
			where: {
				id: game.id,
			},
			data: {
				status,
				meta: gameMeta as any,
			},
			include: {
				guesses: true,
			},
		});
		await message.react(guessed ? '🎉' : '✅');

		const promises = [];
		if (guessed) {
			promises.push(this._points.applyPoints(game, message.author.id));
		}

		promises.push(
			this._message.create(game as GameWithMetaAndGuesses, false),
		);

		await Promise.allSettled(promises);

		if (status !== GameStatus.IN_PROGRESS) {
			// after the message has been send, we can delete the guesses so we don't keep any message content ever.
			await this._prisma.guess.deleteMany({
				where: {
					gameId: game.id,
				},
			});

			if (settings.autoStart) {
				return this.start(guildId);
			}
		}
	}

	async endGame(gameId: number, status: GameStatus = GameStatus.OUT_OF_TIME) {
		const game = await this._prisma.game.update({
			where: {
				id: gameId,
			},
			data: {
				status,
			},
			include: {
				guesses: true,
			},
		});

		await this._message.create(game as GameWithMetaAndGuesses, false);

		// after the message has been send, we can delete the guesses so we don't keep any message content ever.
		return this._prisma.guess.deleteMany({
			where: {
				gameId: game.id,
			},
		});
	}

	getCurrentGame(guildId: string): Promise<Game & { guesses: Guess[] }> {
		return this._prisma.game.findFirst({
			where: {
				guildId,
				endingAt: {
					gt: new Date(),
				},
				status: GameStatus.IN_PROGRESS,
			},
			include: {
				guesses: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	}

	private _checkWord(word: string, guess: string, state: GameMeta) {
		const meta: GameGuessMeta[] = new Array(guess.length);
		const unmatched = {}; // unmatched word letters
		const letterCount = {};

		// color matched guess letters as correct-spot,
		// and count unmatched word letters
		for (let i = 0; i < word.length; i++) {
			const letter = word[i];
			if (letter === guess[i]) {
				letterCount[letter] = (letterCount[letter] || 0) + 1;

				let points = 0;

				if (state.discovery.correct[letter] < letterCount[letter]) {
					points = 2;
					state.discovery.correct[letter] += 1;

					if (state.discovery.almost[letter] >= letterCount[letter]) {
						points = 1;
					}
				}

				if (state.discovery.almost[letter] < letterCount[letter]) {
					state.discovery.almost[letter] += 1;
				}

				meta[i] = {
					type: GAME_TYPE.CORRECT,
					points,
					letter: letter,
				};

				if (
					!state.keyboard[letter] ||
					state.keyboard[letter] !== GAME_TYPE.CORRECT
				) {
					state.keyboard[letter] = GAME_TYPE.CORRECT;
				}

				state.word[i].type = GAME_TYPE.CORRECT;
				continue;
			}

			unmatched[letter] = (unmatched[letter] || 0) + 1;
		}

		// color unmatched guess letters right-to-left,
		// allocating remaining word letters as wrong-spot,
		// otherwise, as not-any-spot
		for (let i = 0; i < word.length; i++) {
			const letter = guess[i];
			if (letter !== word[i]) {
				if (unmatched[letter]) {
					letterCount[letter] = (letterCount[letter] || 0) + 1;

					let points = 0;

					if (state.discovery.almost[letter] < letterCount[letter]) {
						points = 1;
						state.discovery.almost[letter] += 1;
					}

					meta[i] = {
						type: GAME_TYPE.ALMOST,
						points,
						letter: letter,
					};
					unmatched[letter]--;

					if (
						!state.keyboard[letter] ||
						state.keyboard[letter] !== GAME_TYPE.CORRECT
					) {
						state.keyboard[letter] = GAME_TYPE.ALMOST;
					}

					continue;
				}

				meta[i] = {
					type: GAME_TYPE.WRONG,
					points: 0,
					letter: letter,
				};

				if (!state.keyboard[letter]) {
					state.keyboard[letter] = GAME_TYPE.WRONG;
				}
			}
		}

		return {
			meta,
			gameMeta: state,
			guessed: word === guess,
			points: Object.keys(meta).reduce(
				(pts, key) => pts + meta[key].points,
				0,
			),
		};
	}

	private async _checkCooldown(
		userId: string,
		gameId: number,
		cooldown: number,
	): Promise<Date | undefined> {
		if (process.env.NODE_ENV !== 'production') {
			return;
		}

		const lastGuessWithinCooldown = await this._prisma.guess.findFirst({
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

	private _createBaseState(word: string): GameMeta {
		return {
			keyboard: {},
			word: [...word].map((letter, index) => ({
				letter,
				index,
				type: GAME_TYPE.WRONG,
			})),
			discovery: [...word].reduce(
				(data, letter) => {
					data.almost[letter] = 0;
					data.correct[letter] = 0;

					return data;
				},
				{
					almost: {},
					correct: {},
				},
			),
		};
	}
}
