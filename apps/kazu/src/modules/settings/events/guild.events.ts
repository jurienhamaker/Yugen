import { Injectable, Logger } from '@nestjs/common';
import { Events } from 'discord.js';
import { Context, ContextOf, On } from 'necord';

import { SettingsService } from '../services';

@Injectable()
export class SettingsGuildEvents {
	private readonly _logger = new Logger(SettingsGuildEvents.name);

	constructor(private _settings: SettingsService) {}

	@On(Events.GuildCreate)
	public onGuildCreate(@Context() [guild]: ContextOf<Events.GuildCreate>) {
		this._logger.log('Checking settings for guild join event');
		this._settings.getSettings(guild.id);
	}

	@On(Events.GuildDelete)
	public onGuildDelete(@Context() [guild]: ContextOf<Events.GuildDelete>) {
		this._logger.log('Deletting settings for guild delete event');
		this._settings.delete(guild.id);
	}
}
