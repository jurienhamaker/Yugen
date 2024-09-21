import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/kusari';

import { fixFloating } from '@yugen/util';

import { PrismaService } from '@yugen/prisma/kusari';

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

	resetLeaderboard(guildId: string) {
		return this._prisma.playerStats.updateMany({
			where: {
				guildId,
			},
			data: {
				points: 0,
			},
		});
	}

	async getLeaderboard(guildId: string, type: 'points' | 'words', page = 1) {
		const where = {
			guildId,
			inGuild: true,
		};

		let orderBy: Prisma.PlayerStatsOrderByWithRelationInput = {
			points: 'desc',
		};

		if (type === 'words') {
			// TODO: Do something with this..
			orderBy = {
				points: 'desc',
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

	async addPointAndWord(guildId: string, userId: string) {
		const user = await this.getPlayer(guildId, userId);

		return this._prisma.playerStats.update({
			where: {
				id: user.id,
			},
			data: {
				points: fixFloating(user.points + 1),
			},
		});
	}
}
