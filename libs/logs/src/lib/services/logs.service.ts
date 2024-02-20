import { Injectable, Logger } from '@nestjs/common';
import { ChannelType, Client } from 'discord.js';

@Injectable()
export class LogsService {
	private readonly _logger = new Logger(LogsService.name);

	constructor(private _client: Client) {}

	public async log(message: string) {
		const devGuild = await this._client.guilds.fetch(
			process.env['DEVELOPMENT_SERVER_ID'],
		);

		if (!devGuild) {
			return;
		}

		const channel = await devGuild.channels.fetch(
			process.env['LOGS_REPORT_CHANNEL_ID'],
		);

		if (!channel) {
			return;
		}

		if (channel.type !== ChannelType.GuildText) {
			return;
		}

		return channel.send(message);
	}
}
