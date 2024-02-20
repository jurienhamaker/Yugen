import { Module } from '@nestjs/common';
import { SettingsCommands } from './commands/settings.command';
import { SettingsGuildEvents } from './events/guild.events';
import { SettingsSharedModule } from './settings.shared.module';

@Module({
	imports: [SettingsSharedModule],
	providers: [
		// events
		SettingsGuildEvents,

		//commands
		SettingsCommands,
	],
})
export class SettingsModule {}
