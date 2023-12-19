import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Client, Events } from 'discord.js';
import { Once } from 'necord';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class DiscordsService {
	private readonly _logger = new Logger(DiscordsService.name);

	constructor(
		private _client: Client,
		private _http: HttpService,
	) {}

	@Once(Events.ClientReady)
	@Cron('0 */30 * * * *')
	public async sendInformation() {
		if (
			process.env.DISCORDS_TOKEN &&
			process.env.NODE_ENV === 'production'
		) {
			await lastValueFrom(
				this._http.post(
					`https://discords.com/bots/api/bot/${process.env.CLIENT_ID}`,
					{
						server_count: this._client.guilds.cache.size,
					},
					{
						headers: {
							Authorization: process.env.DISCORDS_TOKEN,
						},
					},
				),
			).catch((err) =>
				this._logger.error(
					`Error sending information to Discords`,
					err.stack,
				),
			);

			this._logger.log(`Updated Discords stats`);
		}
	}
}
