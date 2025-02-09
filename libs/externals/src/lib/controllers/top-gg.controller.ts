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
import { TopGGBody } from '../types/top-gg-body';
import { checkAuthorization } from '../util/check-authorization';

@Controller('top-gg')
export class TopGGController {
	constructor(
		private _vote: ExternalsVoteService,
		private _events: EventEmitter2
	) {}

	@Post('/webhook')
	async webhook(@Req() request: Request, @Body() body: TopGGBody) {
		if (!checkAuthorization(request.headers['authorization'])) {
			throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
		}

		if (!body.user) {
			throw new HttpException('Missing user in body', HttpStatus.BAD_REQUEST);
		}

		if (!body.bot) {
			throw new HttpException('Missing bot in body', HttpStatus.BAD_REQUEST);
		}

		if (body.bot != process.env['CLIENT_ID']) {
			throw new HttpException(
				'Incorrect bot client ID',
				HttpStatus.BAD_REQUEST
			);
		}

		this._events.emit('webhook.vote.received', {
			userId: body.user,
			source: 'top-gg',
		});

		await this._vote.sendVoteMessage('top-gg', body.user);

		return {
			status: 'OK',
		};
	}
}
