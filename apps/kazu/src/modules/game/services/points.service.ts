import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/kazu';
import { fixFloating } from '@yugen/util';
import { PrismaService } from '@yugen/prisma/kazu';

@Injectable()
export class GamePointsService {
	private readonly _logger = new Logger(GamePointsService.name);

	constructor(private _prisma: PrismaService) {}

	async getPlayer(
		guildId: string,
		userId: string,
		setInGuild: boolean = true,
	) {
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

	async getLeaderboard(guildId: string, page = 1) {
		const where = {
			guildId,
			inGuild: true,
		};

		const orderBy: Prisma.PlayerStatsOrderByWithRelationInput = {
			points: 'desc',
		};

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

	async addPointAndNumber(guildId: string, userId: string) {
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
