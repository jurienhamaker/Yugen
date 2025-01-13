import { Injectable, Logger } from '@nestjs/common';
import { Game, GameStatus, Guess, Settings } from '@prisma/koto';
import { addMinutes, roundToNearestMinutes, subMinutes } from 'date-fns';
import { Message } from 'discord.js';

import { SettingsService } from '../../settings';
import { WordsService } from '../../words/services/words.service';
import {
	GAME_TYPE,
	GameGuessMeta,
	GameMeta,
	GameWithMetaAndGuesses,
} from '../types/meta';

import { delay, getTimestamp } from '@yugen/util';

import { PrismaService } from '@yugen/prisma/koto';

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
		private _points: GamePointsService
	) {}

	async start(
		guildId: string,
		schedule = false,
		recreate = false,
		word = undefined
	): Promise<boolean | void> {
		this._logger.log(`Trying to start a game for ${guildId}`);

		const currentGame = await this.getCurrentGame(guildId);

		if (currentGame && !recreate) {
			return;
		}

		if (currentGame && recreate) {
			await this.endGame(currentGame.id, GameStatus.FAILED);
			await delay(500);
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

		const ignoredWords = pastFiftyGames.map(g => g.word);
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
				endingAt: roundToNearestMinutes(
					addMinutes(new Date(), settings.timeLimit)
				),
				meta: this._createBaseState(word) as never,
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
		settings: Settings
	) {
		let game = await this.getCurrentGame(guildId);

		console.timeLog(`game ${message.id}`, 'got current game', game.id);
		await this._points.getPlayer(guildId, message.author.id);

		console.timeLog(`game ${message.id}`, 'checked player', game.id);
		if (!game) {
			return;
		}

		const alreadyGuessedIndex = game.guesses.findIndex(
			(g: Guess) => g.word === word
		);
		console.timeLog(
			`game ${message.id}`,
			'checked already guessed',
			game.id,
			alreadyGuessedIndex
		);

		if (alreadyGuessedIndex >= 0 && process.env['NODE_ENV'] === 'production') {
			await message.react('❌');

			// eslint-disable-next-line no-restricted-syntax
			console.timeEnd(`game ${message.id}`);
			return;
		}

		const cooldown = await this._checkCooldown(
			message.author.id,
			game.id,
			settings.cooldown
		);

		console.timeLog(
			`game ${message.id}`,
			'checked cooldown',
			game.id,
			cooldown
		);
		if (cooldown) {
			message.react('🕒');
			message.reply(
				`You're on a cooldown, you can guess again <t:${getTimestamp(
					cooldown
				)}:R>`
			);
			// eslint-disable-next-line no-restricted-syntax
			console.timeEnd(`game ${message.id}`);
			return;
		}

		const { meta, guessed, points, gameMeta } = this._checkWord(
			game.word,
			word,
			game.meta as never
		);

		console.timeLog(`game ${message.id}`, 'checked word', game.id, guessed);

		await this._prisma.guess.create({
			data: {
				game: {
					connect: { id: game.id },
				},
				points,
				userId: message.author.id,
				word,
				meta: meta as never,
			},
		});

		console.timeLog(`game ${message.id}`, 'created guess', game.id);

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
				meta: gameMeta as never,
			},
			include: {
				guesses: true,
			},
		});
		console.timeLog(
			`game ${message.id}`,
			'updated game status',
			game.id,
			game.status
		);

		message
			.react(guessed ? '🎉' : '✅')
			.catch(error => this._logger.error(error));
		console.timeLog(`game ${message.id}`, 'reacted to game status', game.id);

		const promises = [];
		if (guessed) {
			promises.push(this._points.applyPoints(game, message.author.id));
		}

		if (status !== GameStatus.COMPLETED && settings.informCooldownAfterGuess) {
			const cooldown = await this._checkCooldown(
				message.author.id,
				game.id,
				settings.cooldown
			);

			if (cooldown) {
				const cooldownReply = message.reply(
					`Thank you for your guess, you are now on a cooldown. You can guess again <t:${getTimestamp(
						cooldown
					)}:R>`
				);
				promises.push(cooldownReply);
			}
		}

		this._message.create(game as GameWithMetaAndGuesses, false);

		console.timeLog(
			`game ${message.id}`,
			'created points promises',
			game.id,
			promises.length
		);

		await Promise.allSettled(promises);

		console.timeLog(`game ${message.id}`, 'finished points promises', game.id);

		if (status !== GameStatus.IN_PROGRESS) {
			// after the message has been send, we can delete the guesses so we don't keep any message content ever.
			await this._prisma.guess.deleteMany({
				where: {
					gameId: game.id,
				},
			});

			console.timeLog(`game ${message.id}`, 'deleted guesses', game.id);

			if (settings.autoStart) {
				console.timeLog(
					`game ${message.id}`,
					'pre delay to start new game',
					game.id
				);
				await delay(500);

				// eslint-disable-next-line no-restricted-syntax
				console.timeEnd(`game ${message.id}`);
				return this.start(guildId);
			}
		}

		// eslint-disable-next-line no-restricted-syntax
		console.timeEnd(`game ${message.id}`);
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
		const meta: GameGuessMeta[] = Array.from({ length: guess.length });
		const unmatched = {}; // unmatched word letters
		const letterCount = {};

		// color matched guess letters as correct-spot,
		// and count unmatched word letters
		for (const [index, letter] of [...word].entries()) {
			if (letter === guess[index]) {
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

				meta[index] = {
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

				state.word[index].type = GAME_TYPE.CORRECT;
				continue;
			}

			unmatched[letter] = (unmatched[letter] || 0) + 1;
		}

		// color unmatched guess letters right-to-left,
		// allocating remaining word letters as wrong-spot,
		// otherwise, as not-any-spot
		for (const [index, element] of [...word].entries()) {
			const letter = guess[index];
			if (letter !== element) {
				if (unmatched[letter]) {
					letterCount[letter] = (letterCount[letter] || 0) + 1;

					let points = 0;

					if (state.discovery.almost[letter] < letterCount[letter]) {
						points = 1;
						state.discovery.almost[letter] += 1;
					}

					meta[index] = {
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

				meta[index] = {
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
			points: Object.keys(meta).reduce((pts, key) => pts + meta[key].points, 0),
		};
	}

	private async _checkCooldown(
		userId: string,
		gameId: number,
		cooldown: number
	): Promise<Date | undefined | void> {
		if (process.env['NODE_ENV'] !== 'production') {
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
		const data = {
			almost: {},
			correct: {},
		};

		for (const letter of word) {
			data.almost[letter] = 0;
			data.correct[letter] = 0;
		}

		return {
			keyboard: {},
			word: [...word].map((letter, index) => ({
				letter,
				index,
				type: GAME_TYPE.WRONG,
			})),
			discovery: data,
		};
	}
}
