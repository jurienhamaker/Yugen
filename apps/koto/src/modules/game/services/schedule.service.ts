import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameStatus } from '@prisma/koto';
import { PrismaService } from '@yugen/prisma/koto';
import { startOfHour } from 'date-fns';
import { Client } from 'discord.js';
import { GameService } from './game.service';

@Injectable()
export class GameScheduleService {
	private readonly _logger = new Logger(GameScheduleService.name);

	constructor(
		private _prisma: PrismaService,
		private _client: Client,
		private _game: GameService,
	) {}

	@Cron('0 */30 * * * *')
	async check() {
		const outOfTimeGames = await this._prisma.game.findMany({
			where: {
				status: GameStatus.IN_PROGRESS,
				endingAt: startOfHour(new Date()),
			},
			select: {
				id: true,
			},
		});

		this._logger.log(
			`Checking finished game, ending ${outOfTimeGames.length} games.`,
		);
		const endPromises = [];
		for (let { id } of outOfTimeGames) {
			endPromises.push(this._game.endGame(id));
		}
		await Promise.allSettled(endPromises);
		this._logger.log(`Ended ${outOfTimeGames.length} games.`);

		const guildsWithChannelId = await this._prisma.settings.findMany({
			where: {
				channelId: { not: null },
			},
			select: {
				guildId: true,
			},
		});

		this._logger.log(`Checking ${guildsWithChannelId.length} guilds.`);
		const promises = [];
		for (let { guildId } of guildsWithChannelId) {
			const guild = await this._client.guilds
				.fetch(guildId)
				.catch(() => null);
			if (guild) {
				promises.push(this._checkGuild(guildId));
			}
		}

		const guildChecks = await Promise.allSettled(promises);
		const startedGames = guildChecks.filter(
			(r) => r.status === 'fulfilled' && !!r.value,
		);

		this._logger.log(`Started ${startedGames.length} games.`);
	}

	private async _checkGuild(guildId) {
		const lastGame = await this._prisma.game.findFirst({
			where: {
				guildId,
				endingAt: { gt: startOfHour(new Date()) },
			},
		});

		if (lastGame) {
			return false;
		}

		await this._game.start(guildId);
		return true;
	}
}
