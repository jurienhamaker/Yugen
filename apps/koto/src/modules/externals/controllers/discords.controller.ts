import {
	Body,
	Controller,
	HttpException,
	HttpStatus,
	Post,
	Req,
} from '@nestjs/common';
import { ExternalsVoteService } from '../services/vote.service';
import { DiscordsBody } from '../types/discords-body';
import { checkAuthorization } from '../util/check-authorization';

@Controller('discords')
export class DiscordsController {
	constructor(private _vote: ExternalsVoteService) {}

	@Post('/webhook')
	async webhook(@Req() req: Request, @Body() body: DiscordsBody) {
		if (!checkAuthorization(req.headers['authorization'])) {
			throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
		}

		if (!body.user) {
			throw new HttpException(
				'Missing user ID in body',
				HttpStatus.BAD_REQUEST,
			);
		}

		await this._vote.sendVoteMessage('discords', body.user);

		return {
			status: 'OK',
		};
	}
}
