import { Module } from '@nestjs/common';
import { ReactionEvents } from './events/reaction.events';
import { StarboardService } from './services/starboard.service';
import { SharedModule } from '@yugen/shared';
import { SettingsSharedModule } from '../settings';
import { StarboardCommands } from './commands/starboard.commands';

@Module({
	imports: [SharedModule, SettingsSharedModule],
	controllers: [],
	providers: [
		StarboardService,

		// events
		ReactionEvents,

		// commands
		StarboardCommands,
	],
})
export class StarboardModule {}
