import { Module } from '@nestjs/common';

import { SettingsSharedModule } from '../settings';

import { SharedModule } from '@yugen/shared';

import { StarboardCommands } from './commands/starboard.commands';
import { ReactionEvents } from './events/reaction.events';
import { StarboardService } from './services/starboard.service';


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
