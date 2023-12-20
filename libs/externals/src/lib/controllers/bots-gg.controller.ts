import { Controller, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('bots-gg')
export class BotsGGController {
	constructor(private _events: EventEmitter2) {}

	@Post('/webhook')
	webhook() {
		this._events.emit('webhook.vote.received', {
			userId: null,
			source: 'bots-gg',
		});

		return {
			status: 'OK',
		};
	}
}
