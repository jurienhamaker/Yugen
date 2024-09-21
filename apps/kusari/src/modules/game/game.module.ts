import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { KusariSharedModule } from '../../shared.module';

import { GameLeaderboardCommands } from './commands/leaderboard.commants';
import { GamePointsCommands } from './commands/points.commands';
import { GameStartCommands } from './commands/start.commands';
import { GameMessageEvents } from './events/message.events';
import { GameDictionaryService } from './services/dictionary.service';
import { GameService } from './services/game.service';
import { GamePointsService } from './services/points.service';

@Module({
	imports: [KusariSharedModule, HttpModule],
	providers: [
		GameDictionaryService,
		GamePointsService,
		GameService,

		// events
		GameMessageEvents,

		// commands
		GameStartCommands,
		GamePointsCommands,
		GameLeaderboardCommands,
	],
	exports: [GameService],
})
export class GameModule {}
