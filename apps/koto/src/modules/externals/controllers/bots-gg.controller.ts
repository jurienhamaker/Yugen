import { Controller, Post } from '@nestjs/common';

@Controller('bots-gg')
export class BotsGGController {
	@Post('/webhook')
	webhook() {
		return {
			status: 'OK',
		};
	}
}
