import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { HoshiSharedModule } from '../../shared.module';

import { AdminGuildsCommands } from './commands/guilds.commands';
import { AdminNotifyCommands } from './commands/notify.commands';
import { AdminGuildsService } from './services/guilds.service';
import { AdminNotifyService } from './services/notify.service';

@Module({
	imports: [HoshiSharedModule, HttpModule],
	providers: [
		AdminGuildsService,
		AdminNotifyService,

		// commands
		AdminGuildsCommands,
		AdminNotifyCommands,
	],
})
export class AdminModule {}
