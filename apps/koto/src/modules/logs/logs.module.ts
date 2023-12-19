import { Module } from '@nestjs/common';
import { SharedModule } from '@yugen/koto/shared.module';
import { LogsGuildEvents } from './events/guild.events';
import { LogsInteractionEvents } from './events/interaction.events';
import { LogsService } from './services/logs.service';

@Module({
	imports: [SharedModule],
	controllers: [],
	providers: [LogsService, LogsGuildEvents, LogsInteractionEvents],
})
export class LogsModule {}
