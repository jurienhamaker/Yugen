import { Injectable, Logger } from '@nestjs/common';
import { Events, Message, PartialMessage } from 'discord.js';
import { Context, ContextOf, On } from 'necord';
import { SettingsService } from '../../settings/services/settings.services';
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
		const settings = await this._settings.getSettings(message.guildId);
		const num = this._getNumber(message, settings.math);

		if (!num) {
			return;
		}

		if (message.channelId !== settings.channelId) {
			return;
		}

		return this._game.addNumber(message.guildId, num, message, settings);
	}

	@On(Events.MessageDelete)
	public async onMessageDelete(
		@Context() [message]: ContextOf<Events.MessageDelete>,
	) {
		const didChange = await this._didChange(message);

		if (!didChange) {
			return;
		}

		message.channel.send(
			`<@${message.author.id}> just deleted their number 😒
Last number was **${didChange}**!`,
		);
	}

	@On(Events.MessageUpdate)
	public async onMessageUpdate(
		@Context() [message]: ContextOf<Events.MessageDelete>,
	) {
		const didChange = await this._didChange(message);

		if (!didChange) {
			return;
		}

		message.channel.send(
			`<@${message.author.id}> just edited their guess 😒
Last number was **${didChange}**!`,
		);
	}

	private async _didChange(message: Message<boolean> | PartialMessage) {
		const settings = await this._settings.getSettings(message.guildId);
		if (message.channelId !== settings.channelId) {
			return;
		}

		const num = this._getNumber(message, settings.math);
		if (!num) {
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

		if (num !== lastNumber.number) {
			return;
		}

		return lastNumber.number;
	}

	private _getNumber(
		message: Message<boolean> | PartialMessage,
		useMath: boolean = true,
	) {
		if (message.author.bot) {
			return;
		}

		if (!useMath) {
			const num = parseInt(message.cleanContent, 10);

			if (isNaN(num)) {
				return;
			}

			return num;
		}

		const cleaned = message.cleanContent
			.replace(/[^0-9()+\-*/^. ]/g, '')
			.replace(/\^/g, '**');
		console.log(cleaned);

		let parsed: number;
		try {
			parsed = Function(`'use strict'; return (${cleaned})`)();
		} catch {
			return;
		}

		if (isNaN(parsed)) {
			return;
		}

		return parsed;
	}
}
