import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry';
import { GatewayIntentBits } from 'discord.js';
import { NecordModule } from 'necord';

@Module({})
export class SharedModule {
	static forRoot(intents: GatewayIntentBits[]): DynamicModule {
		return {
			module: SharedModule,
			imports: [
				NecordModule.forRoot({
					development:
						process.env['NODE_ENV'] === 'production'
							? false
							: [process.env['DEVELOPMENT_SERVER_ID']],
					skipRegistration: process.env['REGISTER_COMMANDS'] === 'false',
					token: process.env['DISCORD_TOKEN'],
					intents,
				}),
				SentryModule.forRoot({
					dsn: process.env['SENTRY_DNS'],
					debug: process.env['NODE_ENV'] !== 'production',
					environment:
						process.env['NODE_ENV'] === 'production'
							? 'production'
							: 'development',
					logLevels: ['error'],
					sampleRate: 1,
					close: {
						enabled: process.env['NODE_ENV'] === 'production',
						timeout: 5000,
					},
				}),
				ScheduleModule.forRoot(),
				EventEmitterModule.forRoot(),
			],
			providers: [
				{
					provide: APP_INTERCEPTOR,
					useFactory: () => new SentryInterceptor(),
				},
			],
		};
	}
}
