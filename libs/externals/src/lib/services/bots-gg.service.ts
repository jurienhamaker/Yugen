import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Client, Events } from 'discord.js';
import { Once } from 'necord';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BotsGGService {
	private readonly _logger = new Logger(BotsGGService.name);

	constructor(private _client: Client, private _http: HttpService) {}

	@Once(Events.ClientReady)
	@Cron('0 */30 * * * *')
	public async sendInformation() {
		if (
			process.env['BOTS_GG_TOKEN'] &&
			process.env['NODE_ENV'] === 'production'
		) {
			await lastValueFrom(
				this._http.post(
					`https://discord.bots.gg/api/v1/bots/${process.env['CLIENT_ID']}/stats`,
					{
						guildCount: this._client.guilds.cache.size,
						shardCount: this._client.shard?.count,
					},
					{
						headers: {
							Authorization: process.env['BOTS_GG_TOKEN'],
						},
					}
				)
			).catch(error =>
				this._logger.error(`Error sending information to Bots.GG`, error.stack)
			);

			this._logger.log(`Updated Bots.GG stats`);
		}
	}
}
