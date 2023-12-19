import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SharedModule } from '@yugen/koto/shared.module';
import { BotsGGController } from './controllers/bots-gg.controller';
import { DiscordBotListController } from './controllers/discordbotlist.controller';
import { DiscordsController } from './controllers/discords.controller';
import { TopGGController } from './controllers/top-gg.controller';
import { BotsGGService } from './services/bots-gg.service';
import { DiscordBotListService } from './services/discordbotlist.service';
import { DiscordsService } from './services/discords.service';
import { TopGGService } from './services/top-gg.service';
import { ExternalsVoteService } from './services/vote.service';

@Module({
	imports: [SharedModule, HttpModule],
	controllers: [
		TopGGController,
		DiscordsController,
		DiscordBotListController,
		BotsGGController,
	],
	providers: [
		ExternalsVoteService,
		TopGGService,
		DiscordsService,
		DiscordBotListService,
		BotsGGService,
	],
})
export class ExternalsModule {}
