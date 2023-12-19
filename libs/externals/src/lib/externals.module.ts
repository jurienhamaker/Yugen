import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { BotsGGController } from './controllers/bots-gg.controller';
import { DiscordBotListController } from './controllers/discordbotlist.controller';
import { TopGGController } from './controllers/top-gg.controller';
import { BotsGGService } from './services/bots-gg.service';
import { DiscordBotListService } from './services/discordbotlist.service';
import { TopGGService } from './services/top-gg.service';
import { ExternalsVoteService } from './services/vote.service';

@Module({
	imports: [HttpModule],
	controllers: [TopGGController, DiscordBotListController, BotsGGController],
	providers: [
		ExternalsVoteService,
		TopGGService,
		DiscordBotListService,
		BotsGGService,
	],
})
export class ExternalsModule {}
