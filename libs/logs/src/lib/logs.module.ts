import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { LogsGuildEvents } from './events/guild.events';
import { LogsInteractionEvents } from './events/interaction.events';
import { LoggerMiddleware } from './middleware/log.middleware';
import { LogsService } from './services/logs.service';

@Module({
	providers: [LogsService, LogsGuildEvents, LogsInteractionEvents],
})
export class LogsModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).forRoutes({
			path: '*',
			method: RequestMethod.ALL,
		});
	}
}
