import { Injectable } from '@nestjs/common';
import { Events, Message } from 'discord.js';
import { Context, ContextOf, On } from 'necord';

import { SettingsService } from '../../settings/services/settings.services';
import { WordsService } from '../../words/services/words.service';
import { GameService } from '../services/game.service';

@Injectable()
export class GameMessageEvents {
	constructor(
		private _settings: SettingsService,
		private _words: WordsService,
		private _game: GameService
	) {}

	@On(Events.MessageCreate)
	public async onMessageCreate(
		@Context() [message]: ContextOf<Events.MessageCreate>
	): Promise<boolean | Message<boolean> | void> {
		const words = message.content.split(/\b/).filter(v => v !== ' ');

		if (words[0] && words[0] === '!') {
			words.shift();
		}

		if (words.length > 1) {
			return;
		}

		const word = words[0].toLowerCase();

		if (word.length !== 6) {
			return;
		}

		const settings = await this._settings.getSettings(message.guildId);

		if (message.channelId !== settings.channelId) {
			return;
		}

		const exists = this._words.exists(word);

		if (!exists) {
			return message.reply({
				content: `Sorry, I couldn't find "**${word}**" in my database.`,
			});
		}

		return this._game.guess(message.guildId, word, message, settings);
	}
}
