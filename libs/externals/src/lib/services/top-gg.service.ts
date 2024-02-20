import { Injectable, Logger } from '@nestjs/common';
import { Client, Events } from 'discord.js';
import { Once } from 'necord';
import { AutoPoster } from 'topgg-autoposter';

@Injectable()
export class TopGGService {
	private readonly _logger = new Logger(TopGGService.name);

	constructor(private _client: Client) {}

	@Once(Events.ClientReady)
	public onReady() {
		if (process.env['TOP_GG_TOKEN'] && process.env['NODE_ENV'] === 'production') {
			const ap = AutoPoster(process.env['TOP_GG_TOKEN'], this._client);
			ap.on('posted', () => this._logger.log(`Updated top.gg stats`));
		}
	}
}
