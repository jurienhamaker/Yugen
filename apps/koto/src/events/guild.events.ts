import { Injectable, Logger } from '@nestjs/common';
import { sendWelcomeMessage } from '@yugen/koto/util/send-welcome-message';
import { ChannelType, Client, Events, PermissionsBitField } from 'discord.js';
import { Context, ContextOf, On } from 'necord';

@Injectable()
export class GuildEvents {
	private readonly _logger = new Logger(GuildEvents.name);

	constructor(private _client: Client) {}

	@On(Events.GuildCreate)
	public async onGuildCreate(
		@Context() [guild]: ContextOf<Events.GuildCreate>,
	) {
		this._logger.log(`Joined a new guild ${guild.name}`);

		const channel = guild.channels.cache.find(
			(c) =>
				c.type === ChannelType.GuildText &&
				c
					.permissionsFor(this._client.user)
					.has(PermissionsBitField.Flags.SendMessages),
		);

		if (channel) {
			this._logger.log(
				`Sending welcome message to ${channel.id} in ${guild.id}`,
			);

			await sendWelcomeMessage(channel, this._client);
		}
	}

	@On(Events.GuildDelete)
	public onGuildDelete(@Context() [guild]: ContextOf<Events.GuildDelete>) {
		this._logger.log(`Deleted a guild ${guild.name}`);
	}
}
