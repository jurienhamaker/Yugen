import { Injectable, Logger } from '@nestjs/common';
import { Events } from 'discord.js';
import { Context, ContextOf, On } from 'necord';
import { LogsService } from '../services/logs.service';

@Injectable()
export class LogsGuildEvents {
	private readonly _logger = new Logger(LogsGuildEvents.name);

	constructor(private _logs: LogsService) {}

	@On(Events.GuildCreate)
	public onGuildCreate(@Context() [guild]: ContextOf<Events.GuildCreate>) {
		return this._logs.log(
			`🎉 Joined guild **${guild.name}** | ${guild.id}`,
		);
	}

	@On(Events.GuildDelete)
	public onGuildDelete(@Context() [guild]: ContextOf<Events.GuildDelete>) {
		return this._logs.log(`😥 Left guild **${guild.name}** | ${guild.id}`);
	}
}
