import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { KusariSharedModule } from '../../shared.module';
import { AdminGuildsCommands } from './commands/guilds.commands';
import { AdminGuildsService } from './services/guilds.service';
import { AdminNotifyService } from './services/notify.service';
import { AdminNotifyCommands } from './commands/notify.commands';

@Module({
	imports: [KusariSharedModule, HttpModule],
	providers: [
		AdminGuildsService,
		AdminNotifyService,

		// commands
		AdminGuildsCommands,
		AdminNotifyCommands,
	],
})
export class AdminModule {}
