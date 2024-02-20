import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameStatus } from '@prisma/koto';
import { PrismaService } from '@yugen/prisma/koto';
import { addMinutes } from 'date-fns';
import { Client } from 'discord.js';
import { SettingsService } from '../../settings';
import { GameService } from './game.service';

@Injectable()
export class GameScheduleService {
	private readonly _logger = new Logger(GameScheduleService.name);

	constructor(
		private _prisma: PrismaService,
		private _client: Client,
		private _game: GameService,
		private _settings: SettingsService,
	) {}

	@Cron(`0 ${process.env['NODE_ENV'] === 'production' ? '*/10' : '*'} * * * *`)
	async check() {
		const outOfTimeGames = await this._prisma.game.findMany({
			where: {
				status: GameStatus.IN_PROGRESS,
				endingAt: {
					lte: new Date(),
				},
			},
			select: {
				id: true,
				guildId: true,
			},
		});

		this._logger.log(
			`Checking finished game, ending ${outOfTimeGames.length} games.`,
		);
		const endPromises = [];
		for (const game of outOfTimeGames) {
			endPromises.push(this._endGame(game.id, game.guildId));
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
		for (const { guildId } of guildsWithChannelId) {
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

	private async _endGame(id: number, guildId: string) {
		await this._game.endGame(id);

		const settings = await this._settings.getSettings(guildId);
		if (settings.autoStart) {
			await this._game.start(guildId, false);
		}
	}

	private async _checkGuild(guildId) {
		const settings = await this._settings.getSettings(guildId);
		const currentGame = await this._prisma.game.findFirst({
			where: {
				guildId,
				status: GameStatus.IN_PROGRESS,
				endingAt: { gt: new Date() },
			},
		});

		if (currentGame) {
			return false;
		}

		const scheduleStartedGame = await this._prisma.game.findFirst({
			where: {
				guildId,
				scheduleStarted: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		if (
			addMinutes(scheduleStartedGame.createdAt, settings.frequency) >
			new Date()
		) {
			return false;
		}

		await this._game.start(guildId, true);
		return true;
	}
}
