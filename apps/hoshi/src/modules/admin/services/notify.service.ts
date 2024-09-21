import { Injectable } from '@nestjs/common';
import { ChannelType, Client } from 'discord.js';

import { PrismaService } from '@yugen/prisma/hoshi';

@Injectable()
export class AdminNotifyService {
	constructor(private _client: Client, private _prisma: PrismaService) {}

	async sendNotification(content: string) {
		const settings = await this._prisma.settings.findMany();

		let successByBotChannelId = 0;
		let successByStarboard = 0;

		for (const setting of settings) {
			const guild = await this._client.guilds
				.fetch(setting.guildId)
				.catch(() => null);
			if (!guild) {
				continue;
			}

			let usingStarboard = false;
			let channelId = setting.botUpdatesChannelId;
			if (!channelId) {
				const starboard = await this._prisma.starboards.findFirst({
					where: {
						guildId: setting.guildId,
					},
				});

				if (!starboard) {
					continue;
				}

				usingStarboard = true;
				channelId = starboard.targetChannelId;
			}

			const channel = await guild.channels.fetch(channelId).catch(() => null);
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
				if (usingStarboard) {
					successByStarboard++;
					continue;
				}

				successByBotChannelId++;
			}
		}

		return {
			total: settings.length,
			successByBotChannelId,
			successByStarboard,
		};
	}
}
