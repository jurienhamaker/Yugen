import {
	Body,
	Controller,
	HttpException,
	HttpStatus,
	Post,
	Req,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ExternalsVoteService } from '../services/vote.service';
import { DiscordBotListBody } from '../types/discordbotlist-body';
import { checkAuthorization } from '../util/check-authorization';

@Controller('discordbotlist')
export class DiscordBotListController {
	constructor(
		private _vote: ExternalsVoteService,
		private _events: EventEmitter2
	) {}

	@Post('/webhook')
	async webhook(@Req() request: Request, @Body() body: DiscordBotListBody) {
		if (!checkAuthorization(request.headers['authorization'])) {
			throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
		}

		if (body.admin) {
			return {
				status: 'OK',
			};
		}

		if (!body.id) {
			throw new HttpException(
				'Missing user ID in body',
				HttpStatus.BAD_REQUEST
			);
		}

		this._events.emit('webhook.vote.received', {
			userId: body.id,
			source: 'discordbotlist',
		});

		await this._vote.sendVoteMessage('discord-bot-list', body.id);

		return {
			status: 'OK',
		};
	}
}
