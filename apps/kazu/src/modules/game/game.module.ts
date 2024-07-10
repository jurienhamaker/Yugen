import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { KazuSharedModule } from '../../shared.module';
import { GameLeaderboardCommands } from './commands/leaderboard.commants';
import { GamePointsCommands } from './commands/points.commands';
import { GameStartCommands } from './commands/start.commands';
import { GameMessageEvents } from './events/message.events';
import { GameService } from './services/game.service';
import { GamePointsService } from './services/points.service';

@Module({
	imports: [KazuSharedModule, HttpModule],
	providers: [
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
