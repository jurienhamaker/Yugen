import { Injectable, Logger } from '@nestjs/common';
import { ChannelType, Client } from 'discord.js';

@Injectable()
export class ExternalsVoteService {
	private readonly _logger = new Logger(ExternalsVoteService.name);

	private _sourceNames = {
		'top-gg': 'Top.GG',
		'bots-gg': 'Bots.GG',
		discords: 'Discords.com',
		'discord-bot-list': 'Discord Bot List',
	};

	constructor(private _client: Client) {}

	public async sendVoteMessage(
		source: 'top-gg' | 'bots-gg' | 'discords' | 'discord-bot-list',
		userId: string,
	) {
		const guild = await this._client.guilds.fetch(
			process.env.DEVELOPMENT_SERVER_ID,
		);
		if (!guild) {
			return false;
		}

		const channel = await guild.channels.fetch(
			process.env.VOTE_REPORT_CHANNEL_ID,
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
