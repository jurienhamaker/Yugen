import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/kusari';
import { PrismaService } from '@yugen/prisma/kusari';
import { fixFloating } from '@yugen/util';
import { isWeekend } from 'date-fns';
import { Client } from 'discord.js';

@Injectable()
export class GamePointsService {
	private readonly _logger = new Logger(GamePointsService.name);

	constructor(
		private _prisma: PrismaService,
		private _client: Client,
	) {}

	@OnEvent('webhook.vote.received')
	onVote({ userId }: { userId }) {
		const saves = isWeekend(new Date()) ? 0.5 : 0.25;
		this._logger.log(
			`Received webhook vote, adding ${saves} saves to ${userId}`,
		);
		this.addSave(userId, saves);
	}

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

	async addSave(userId: string, amount: number) {
		const players = await this._prisma.playerStats.findMany({
			where: {
				userId,
			},
		});

		const promises = [];
		for (const player of players) {
			if (player.saves == 2) {
				continue;
			}

			const newSaves = fixFloating(player.saves + amount);
			const update = this._prisma.playerStats.update({
				where: {
					id: player.id,
				},
				data: {
					saves: newSaves > 2 ? 2 : newSaves,
				},
			});

			promises.push(update);
		}

		return Promise.allSettled(promises);
	}

	async deductSave(guildId: string, userId: string, amount: number) {
		const player = await this.getPlayer(guildId, userId);

		const newSave = fixFloating(player.saves - amount);
		return this._prisma.playerStats.update({
			where: {
				id: player.id,
			},
			data: {
				saves: newSave < 0 ? 0 : newSave,
			},
		});
	}
}
