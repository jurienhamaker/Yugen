import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { NecordModule } from 'necord';
import { AppEvents } from './events/app.events';
import { GuildEvents } from './events/guild.events';
import { InteractionEvents } from './events/interaction.events';
import { MetricsEvents } from './events/metrics.events';
import { botMetrics } from './metrics/bot.metrics';
import { channelMetrics } from './metrics/channel.metrics';
import { guildMetrics } from './metrics/guild.metrics';
import { interactionMetrics } from './metrics/interaction.metrics';
import { userMetrics } from './metrics/user.metrics';
import { LoggerMiddleware } from './middleware/log.middleware';
import { AdminModule } from './modules/admin/admin.module';
import { ExternalsModule } from './modules/externals/externals.module';
import { GameModule } from './modules/game/game.module';
import { GeneralModule } from './modules/general/general.module';
import { HealthModule } from './modules/health';
import { LogsModule } from './modules/logs/logs.module';
import { SettingsModule } from './modules/settings';
import { WordsModule } from './modules/words/words.module';
import { SharedModule } from './shared.module';
import { intents } from './util/intents';

@Module({
	imports: [
		NecordModule.forRoot({
			development:
				process.env.NODE_ENV !== 'production'
					? [process.env.DEVELOPMENT_SERVER_ID]
					: false,
			skipRegistration: process.env.REGISTER_COMMANDS === 'false',
			token: process.env.DISCORD_TOKEN!,
			intents,
		}),
		SentryModule.forRoot({
			dsn: process.env.SENTRY_DNS,
			debug: process.env.NODE_ENV !== 'production',
			environment:
				process.env.NODE_ENV === 'production'
					? 'production'
					: 'development',
			logLevels: ['error'],
			sampleRate: 1,
			close: {
				enabled: process.env.NODE_ENV === 'production',
				timeout: 5000,
			},
		}),
		PrometheusModule.register(),
		ScheduleModule.forRoot(),

		// app
		SettingsModule,
		SharedModule,
		HealthModule,
		GeneralModule,
		WordsModule,
		GameModule,
		AdminModule,
		ExternalsModule,
		LogsModule,
	],
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useFactory: () => new SentryInterceptor(),
		},

		// prometheus
		...botMetrics,
		...guildMetrics,
		...channelMetrics,
		...userMetrics,
		...interactionMetrics,

		// events
		AppEvents,
		InteractionEvents,
		GuildEvents,
		MetricsEvents,
	],
})
export class KotoModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).forRoutes({
			path: '*',
			method: RequestMethod.ALL,
		});
	}
}
