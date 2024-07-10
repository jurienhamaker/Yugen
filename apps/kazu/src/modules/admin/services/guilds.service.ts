import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'discord.js';

@Injectable()
export class AdminGuildsService {
	private readonly _logger = new Logger(AdminGuildsService.name);

	constructor(private _client: Client) {}

	async getData(page = 1) {
		await this._client.guilds.fetch();
		const guilds = this._client.guilds.cache.sort(
			(a, b) => b.memberCount - a.memberCount,
		);

		return {
			guilds: [...guilds.values()].slice((page - 1) * 10, page * 10),
			total: guilds.size,
		};
	}
}
