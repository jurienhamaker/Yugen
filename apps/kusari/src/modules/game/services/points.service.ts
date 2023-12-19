import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/kusari';
import { PrismaService } from '@yugen/prisma/kusari';
import { Client } from 'discord.js';

@Injectable()
export class GamePointsService {
	private readonly _logger = new Logger(GamePointsService.name);

	constructor(
		private _prisma: PrismaService,
		private _client: Client,
	) {}

	async getPlayer(
		guildId: string,
		userId: string,
		setInGuild: boolean = true,
	) {
		const user = await this._prisma.player.findFirst({
			where: {
				guildId,
				userId,
			},
		});

		if (!user) {
			return this._prisma.player.create({
				data: {
					guildId,
					userId,
					inGuild: true,
				},
			});
		}

		if (setInGuild) {
			await this._prisma.player.update({
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

		return this._prisma.player.update({
			where: {
				id: user.id,
			},
			data: {
				inGuild: false,
			},
		});
	}

	async getLeaderboard(guildId: string, type: 'points' | 'words', page = 1) {
		const where = {
			guildId,
			inGuild: true,
		};

		let orderBy: Prisma.PlayerOrderByWithRelationInput = {
			points: 'desc',
		};

		if (type === 'words') {
			// TODO: Do something with this..
			orderBy = {
				points: 'desc',
			};
		}

		const playersPromise = this._prisma.player.findMany({
			where,
			orderBy,
			take: 10,
			skip: (page - 1) * 10,
		});

		const totalPromise = this._prisma.player.count({
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

		return this._prisma.player.update({
			where: {
				id: user.id,
			},
			data: {
				points: user.points + 1,
			},
		});
	}
}
