import { Injectable, Logger } from '@nestjs/common';
import { ChannelType, Client } from 'discord.js';
import { PrismaService } from '@yugen/prisma/kusari';

@Injectable()
export class AdminNotifyService {
	private readonly _logger = new Logger(AdminNotifyService.name);

	constructor(
		private _client: Client,
		private _prisma: PrismaService,
	) {}

	async sendNotification(content: string) {
		const settings = await this._prisma.settings.findMany({
			where: {
				OR: [
					{ channelId: { not: null } },
					{ botUpdatesChannelId: { not: null } },
				],
			},
		});

		let successByBotChannelId = 0;
		let successByChannelId = 0;

		for (const setting of settings) {
			const guild = await this._client.guilds
				.fetch(setting.guildId)
				.catch(() => null);
			if (!guild) {
				continue;
			}

			let channelId = setting.botUpdatesChannelId;
			if (!channelId) {
				channelId = setting.channelId;
			}

			const channel = await guild.channels
				.fetch(channelId)
				.catch(() => null);
			if (!channel) {
				continue;
			}

			if (channel.type !== ChannelType.GuildText) {
				continue;
			}

			const resp = await channel
				.send({
					content,
				})
				.catch(() => null);

			if (resp) {
				if (setting.botUpdatesChannelId) {
					successByBotChannelId++;
					continue;
				}

				successByChannelId++;
			}
		}

		return {
			total: settings.length,
			successByBotChannelId,
			successByChannelId,
		};
	}
}
