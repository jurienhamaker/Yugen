import { Injectable } from '@nestjs/common';
import { ChannelType, Client } from 'discord.js';

@Injectable()
export class LogsService {
	constructor(private _client: Client) {}

	public async log(message: string) {
		const developmentGuild = await this._client.guilds.fetch(
			process.env['DEVELOPMENT_SERVER_ID']
		);

		if (!developmentGuild) {
			return;
		}

		const channel = await developmentGuild.channels.fetch(
			process.env['LOGS_REPORT_CHANNEL_ID']
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
