import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '@yugen/kusari/modules/settings/services';
import { Events } from 'discord.js';
import { Context, ContextOf, On } from 'necord';
import { GameService } from '../services/game.service';

@Injectable()
export class GameMessageEvents {
	private readonly _logger = new Logger(GameMessageEvents.name);

	constructor(
		private _settings: SettingsService,
		private _game: GameService,
	) {}

	@On(Events.MessageCreate)
	public async onMessageCreate(
		@Context() [message]: ContextOf<Events.MessageCreate>,
	) {
		if (message.author.bot) {
			return;
		}

		const words = message.content.split(/\b/).filter((v) => v !== ' ');

		if (words[0] && words[0] === '!') {
			words.shift();
		}

		if (words.length > 1) {
			return;
		}

		const word = words[0].toLowerCase();

		const settings = await this._settings.getSettings(message.guildId);

		if (message.channelId !== settings.channelId) {
			return;
		}

		return this._game.addWord(message.guildId, word, message, settings);
	}
}
