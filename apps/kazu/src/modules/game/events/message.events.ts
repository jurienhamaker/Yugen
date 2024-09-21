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
		const settings = await this._settings.getSettings(message.guildId);
		const number_ = this._getNumber(message, settings.math);

		if (!number_) {
			return;
		}

		if (message.channelId !== settings.channelId) {
			return;
		}

		return this._game.addNumber(message.guildId, number_, message, settings);
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
			`<@${message.author.id}> just deleted their number 😒
Last number was **${didChange}**!`
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
Last number was **${didChange}**!`
		);
	}

	private async _didChange(message: Message<boolean> | PartialMessage) {
		const settings = await this._settings.getSettings(message.guildId);
		if (message.channelId !== settings.channelId) {
			return;
		}

		const number_ = this._getNumber(message, settings.math);
		if (!number_) {
			return;
		}

		const game = await this._game.getCurrentGame(message.guildId);
		if (!game) {
			return;
		}

		const lastNumber = await this._game.getLastNumber(game);
		if (!lastNumber) {
			return;
		}

		if (number_ !== lastNumber.number) {
			return;
		}

		return lastNumber.number;
	}

	private _getNumber(
		message: Message<boolean> | PartialMessage,
		useMath: boolean = true
	) {
		if (message.author.bot) {
			return;
		}

		if (!useMath) {
			const number_ = Number.parseInt(message.cleanContent, 10);

			if (Number.isNaN(number_)) {
				return;
			}

			return number_;
		}

		if (/[^\d ()*+./^-]/g.test(message.cleanContent)) {
			return;
		}

		const cleaned = message.cleanContent
			.replaceAll(/[^\d ()*+./^-]/g, '')
			.replaceAll('^', '**');

		let parsed: number;
		try {
			parsed = new Function(`'use strict'; return (${cleaned})`)();
		} catch {
			return;
		}

		if (Number.isNaN(parsed)) {
			return;
		}

		return parsed;
	}
}
