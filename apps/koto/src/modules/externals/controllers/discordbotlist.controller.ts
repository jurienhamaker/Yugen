import {
	Body,
	Controller,
	HttpException,
	HttpStatus,
	Post,
	Req,
} from '@nestjs/common';
import { ExternalsVoteService } from '../services/vote.service';
import { DiscordBotListBody } from '../types/discordbotlist-body';
import { checkAuthorization } from '../util/check-authorization';

@Controller('discordbotlist')
export class DiscordBotListController {
	constructor(private _vote: ExternalsVoteService) {}

	@Post('/webhook')
	async webhook(@Req() req: Request, @Body() body: DiscordBotListBody) {
		if (!checkAuthorization(req.headers['authorization'])) {
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
				HttpStatus.BAD_REQUEST,
			);
		}

		await this._vote.sendVoteMessage('discord-bot-list', body.id);

		return {
			status: 'OK',
		};
	}
}
