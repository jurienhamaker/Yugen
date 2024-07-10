import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { KazuSharedModule } from '../../shared.module';
import { AdminGuildsCommands } from './commands/guilds.commands';
import { AdminGuildsService } from './services/guilds.service';

@Module({
	imports: [KazuSharedModule, HttpModule],
	providers: [
		AdminGuildsService,

		// commands
		AdminGuildsCommands,
	],
})
export class AdminModule {}
