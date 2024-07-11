import { Injectable, Logger } from '@nestjs/common';
import { Game, GameStatus, GameType, Settings } from '@prisma/kazu';
import { PrismaService } from '@yugen/prisma/kazu';
import { getTimestamp } from '@yugen/util';
import { addMinutes, subMinutes } from 'date-fns';
import { ChannelType, Client, Message } from 'discord.js';
import { SettingsService } from '../../settings';
import { GamePointsService } from './points.service';

@Injectable()
export class GameService {
	private readonly _logger = new Logger(GameService.name);

	constructor(
		private _prisma: PrismaService,
		private _points: GamePointsService,
		private _settings: SettingsService,
		private _client: Client,
	) {}

	async start(
		guildId: string,
		type: GameType = GameType.NORMAL,
		recreate = false,
		shamedData?: {
			message: Message;
			lastShameUserId: string;
			roleId: string;
		},
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
			await this.endGame(currentGame.id, GameStatus.FAILED, shamedData);
		}

		await this._prisma.game.create({
			data: {
				guildId,
				type,
				history: {
					create: {
						number: 0,
						userId: this._client.user.id,
					},
				},
			},
		});

		if (channel.type === ChannelType.GuildText) {
			channel.send(`**A new game has started!**
Start the count from **1**`);
		}

		return true;
	}

	async addNumber(
		guildId: string,
		num: number,
		message: Message,
		settings: Settings,
	) {
		const game = await this.getCurrentGame(guildId);

		if (!game) {
			return;
		}

		const lastNumber = await this.getLastNumber(game);

		const isNextNumber = num === lastNumber.number + 1;
		const isSameUser = lastNumber.userId === message.author.id;
		if (!isNextNumber || isSameUser) {
			const failReason = isSameUser
				? `<@${message.author.id}> counted twice in a row!`
				: `${num} is not the next number!`;

			const saveAvailable = await this._getSaves(
				settings,
				message.author.id,
			);

			const count = await this._getCount(game.id);
			message.react('❌').catch(() => null);

			if (saveAvailable.player >= 1) {
				const { saves } = await this._points.deductSave(
					guildId,
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

			const highscore = await this._checkStreak(settings, count);

			await message.reply(
				`${failReason}
**The game has ended on a streak of ${count}!**${
					highscore
						? `
**A new highscore has been set! 🎉**`
						: ''
				}

**Want to save the game?** Make sure to **/vote** for Kazu and earn yourself saves to save the game!`,
			);

			return this.start(guildId, game.type, true, {
				message,
				lastShameUserId: settings.lastShameUserId,
				roleId: settings.shameRoleId,
			});
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

		await this._points.addPointAndNumber(guildId, message.author.id);
		await this._prisma.history.create({
			data: {
				number: num,
				userId: message.author.id,
				gameId: game.id,
			},
		});

		const count = await this._getCount(game.id);
		const highscore = await this._checkStreak(settings, count);
		await message.react(highscore ? '☑️' : '✅').catch(() => null);

		this._setNumber(message, count);
	}

	async endGame(
		gameId: number,
		status: GameStatus = GameStatus.COMPLETED,
		shamedData?: {
			message: Message;
			lastShameUserId: string;
			roleId: string;
		},
	) {
		await this._prisma.game.update({
			where: {
				id: gameId,
			},
			data: {
				status,
			},
		});

		if (shamedData) {
			const { message, lastShameUserId, roleId } = shamedData;
			await this._settings.set(
				message.guild.id,
				'lastShameUserId',
				message.author.id,
			);

			const lastShamedMember = lastShameUserId
				? await message.guild.members
						.fetch(lastShameUserId)
						.catch(() => null)
				: null;
			if (lastShamedMember && roleId) {
				await lastShamedMember.roles.remove(roleId).catch(() => null);
			}

			const member = await message.guild.members.fetch(message.author.id);
			if (member && roleId) {
				await member.roles.add(roleId).catch(() => null);
			}
		}
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

	async getLastNumber(game: Game) {
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
		const player = await this._points.getPlayer(settings.guildId, userId);

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

	private async _checkStreak(settings: Settings, count: number) {
		let isHighscore = false;
		if (count > settings.highscore) {
			isHighscore = true;
			await this._settings.set(settings.guildId, 'highscore', count);
			await this._settings.set(
				settings.guildId,
				'highscoreDate',
				new Date(),
			);
		}

		return isHighscore;
	}

	private async _setNumber(message: Message, count: number) {
		if (count === 69) {
			await message.react('1260697303224815696').catch(() => null);
		}

		if (count === 420) {
			await message.react('🍃').catch(() => null);
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
}
