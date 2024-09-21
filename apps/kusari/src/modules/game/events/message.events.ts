import { Injectable } from '@nestjs/common';
import { Events, Message, PartialMessage } from 'discord.js';
import { Context, ContextOf, On } from 'necord';

import { SettingsService } from '../../settings/services/settings.services';
import { GameService } from '../services/game.service';

@Injectable()
export class GameMessageEvents {
	constructor(private _settings: SettingsService, private _game: GameService) {}

	@On(Events.MessageCreate)
	public async onMessageCreate(
		@Context() [message]: ContextOf<Events.MessageCreate>
	) {
		const word = this._getWord(message);

		if (!word) {
			return;
		}

		const settings = await this._settings.getSettings(message.guildId);
		if (message.channelId !== settings.channelId) {
			return;
		}

		return this._game.addWord(message.guildId, word, message, settings);
	}

	@On(Events.MessageDelete)
	public async onMessageDelete(
		@Context() [message]: ContextOf<Events.MessageDelete>
	) {
		const didChange = await this._didChange(message);

		if (!didChange) {
			return;
		}

		message.channel.send(
			`<@${message.author.id}> just deleted their guess 😒
Last word was **${didChange}**!
The next letter is **${didChange.at(-1)}**`
		);
	}

	@On(Events.MessageUpdate)
	public async onMessageUpdate(
		@Context() [message]: ContextOf<Events.MessageDelete>
	) {
		const didChange = await this._didChange(message);

		if (!didChange) {
			return;
		}

		message.channel.send(
			`<@${message.author.id}> just edited their guess 😒
Last word was **${didChange}**!
The next letter is **${didChange.at(-1)}**`
		);
	}

	private async _didChange(message: Message<boolean> | PartialMessage) {
		const settings = await this._settings.getSettings(message.guildId);
		if (message.channelId !== settings.channelId) {
			return;
		}

		const word = this._getWord(message);
		if (!word) {
			return;
		}

		const game = await this._game.getCurrentGame(message.guildId);
		if (!game) {
			return;
		}

		const lastWord = await this._game.getLastWord(game);
		if (!lastWord) {
			return;
		}

		if (word !== lastWord.word) {
			return;
		}

		return lastWord.word;
	}

	private _getWord(message: Message<boolean> | PartialMessage) {
		if (message.author.bot) {
			return;
		}

		const words = message.content.split(/\b/).filter(v => v !== ' ');

		if (words[0] && words[0] === '!') {
			words.shift();
		}

		if (words.length > 1) {
			return;
		}

		const word = words[0].toLowerCase();

		return word;
	}
}
