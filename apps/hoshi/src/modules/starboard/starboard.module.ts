import { Module } from '@nestjs/common';
import { StarboardReactionEvents } from './events/reaction.events';
import { StarboardService } from './services/starboard.service';
import { SharedModule } from '@yugen/shared';
import { SettingsSharedModule } from '../settings';

@Module({
	imports: [SharedModule, SettingsSharedModule],
	controllers: [],
	providers: [
		StarboardService,

		// events
		StarboardReactionEvents,

		// commands
	],
})
export class StarboardModule {}
