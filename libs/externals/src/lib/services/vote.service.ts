import { Injectable, Logger } from '@nestjs/common';
import { ChannelType, Client } from 'discord.js';

@Injectable()
export class ExternalsVoteService {
	private readonly _logger = new Logger(ExternalsVoteService.name);

	constructor(private _client: Client) {}

	public async sendVoteMessage(
		source: 'top-gg' | 'bots-gg' | 'discord-bot-list',
		userId: string
	) {
		const guild = await this._client.guilds.fetch(
			process.env['DEVELOPMENT_SERVER_ID']
		);
		if (!guild) {
			return false;
		}

		const channel = await guild.channels.fetch(
			process.env['VOTE_REPORT_CHANNEL_ID']
		);
		if (!channel) {
			return false;
		}

		if (channel.type !== ChannelType.GuildText) {
			return false;
		}

		this._logger.log(`${userId} has voted on ${source}!`);
		return channel.send({
			content: `<@${userId}> has voted on **${source}**!`,
			allowedMentions: {
				users: [],
			},
		});
	}
}
