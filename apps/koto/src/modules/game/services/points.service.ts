import { Injectable } from '@nestjs/common';
import { Game, Guess, Prisma } from '@prisma/koto';

import { fixFloating } from '@yugen/util';

import { PrismaService } from '@yugen/prisma/koto';

@Injectable()
export class GamePointsService {
	constructor(private _prisma: PrismaService) {}

	async getPlayer(guildId: string, userId: string, setInGuild: boolean = true) {
		const user = await this._prisma.playerStats.findFirst({
			where: {
				guildId,
				userId,
			},
		});

		if (!user) {
			return this._prisma.playerStats.create({
				data: {
					guildId,
					userId,
					inGuild: true,
				},
			});
		}

		if (setInGuild) {
			await this._prisma.playerStats.update({
				where: {
					id: user.id,
				},
				data: {
					inGuild: true,
				},
			});
		}

		return user;
	}

	async removePlayerFromGuild(guildId: string, userId: string) {
		const user = await this.getPlayer(guildId, userId);

		return this._prisma.playerStats.update({
			where: {
				id: user.id,
			},
			data: {
				inGuild: false,
			},
		});
	}

	resetLeaderboard(guildId: string, userId: string) {
		return this._prisma.playerStats.deleteMany({
			where: {
				guildId,
				...(userId ? { userId } : {}),
			},
		});
	}

	async getLeaderboard(
		guildId: string,
		type: 'points' | 'wins' | 'participated' = 'points',
		page = 1
	) {
		const where = {
			guildId,
			inGuild: true,
		};

		let orderBy: Prisma.PlayerStatsOrderByWithRelationInput = {
			points: 'desc',
		};

		if (type === 'wins') {
			orderBy = {
				wins: 'desc',
			};
		}

		if (type === 'participated') {
			orderBy = {
				participated: 'desc',
			};
		}

		const playersPromise = this._prisma.playerStats.findMany({
			where,
			orderBy,
			take: 10,
			skip: (page - 1) * 10,
		});

		const totalPromise = this._prisma.playerStats.count({
			where,
		});

		const [players, total] = await Promise.allSettled([
			playersPromise,
			totalPromise,
		]);

		if (players.status !== 'fulfilled' || total.status !== 'fulfilled') {
			return {
				players: [],
				total: 0,
			};
		}

		return {
			players: players.value,
			total: total.value,
		};
	}

	async applyPoints(game: Game & { guesses: Guess[] }, winnerId: string) {
		const users = {};

		for (const guess of game.guesses) {
			if (!users[guess.userId]) {
				users[guess.userId] = guess.points + 2;
				continue;
			}

			users[guess.userId] += guess.points;
			users[guess.userId] = fixFloating(users[guess.userId]);
		}

		const promises = [];
		for (const userId of Object.keys(users)) {
			const promise = this._applyPointsToPlayer(
				game.guildId,
				userId,
				users[userId],
				userId === winnerId
			);

			promises.push(promise);
		}

		return Promise.allSettled(promises);
	}

	private async _applyPointsToPlayer(
		guildId: string,
		userId: string,
		points: number,
		isWinner: boolean = false
	) {
		const user = await this.getPlayer(guildId, userId);

		return this._prisma.playerStats.update({
			where: {
				id: user.id,
			},
			data: {
				participated: fixFloating(user.participated + 1),
				wins: fixFloating(user.wins + (isWinner ? 1 : 0)),
				points: fixFloating(user.points + points),
			},
		});
	}
}
