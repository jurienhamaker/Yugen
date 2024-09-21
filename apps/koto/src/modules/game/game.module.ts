import { Module } from '@nestjs/common';

import { KotoSharedModule } from '../../shared.module';
import { WordsModule } from '../words/words.module';

import { GameLeaderboardCommands } from './commands/leaderboard.commants';
import { GamePointsCommands } from './commands/points.commands';
import { GameStartCommands } from './commands/start.commands';
import { GameClientEvents } from './events/client.events';
import { GameMessageEvents } from './events/message.events';
import { GameService } from './services/game.service';
import { GameMessageService } from './services/message.service';
import { GamePointsService } from './services/points.service';
import { GameScheduleService } from './services/schedule.service';

@Module({
	imports: [KotoSharedModule, WordsModule],
	providers: [
		GameMessageService,
		GamePointsService,
		GameService,
		GameScheduleService,

		// events
		GameClientEvents,
		GameMessageEvents,

		// commands
		GameStartCommands,
		GamePointsCommands,
		GameLeaderboardCommands,
	],
	exports: [GameService],
})
export class GameModule {}
