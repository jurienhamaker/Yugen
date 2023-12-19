import { Injectable, Logger } from '@nestjs/common';
import { Client, Events } from 'discord.js';
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
	}

	@On(Events.GuildDelete)
	public onGuildDelete(@Context() [guild]: ContextOf<Events.GuildDelete>) {
		this._logger.log(`Deleted a guild ${guild.name}`);
	}
}
