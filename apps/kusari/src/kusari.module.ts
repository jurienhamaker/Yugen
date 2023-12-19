import { Module } from '@nestjs/common';
import { ExternalsModule } from '@yugen/externals';
import { GeneralModule } from '@yugen/general';
import { HealthModule } from '@yugen/health';
import { LogsModule } from '@yugen/logs';
import { MetricsModule } from '@yugen/metrics';
import { SharedModule } from '@yugen/shared';
import { GuildEvents } from './events/guild.events';
import { KusariSharedModule } from './shared.module';
import { EMBED_COLOR } from './util/constants';
import { intents } from './util/intents';

@Module({
	imports: [
		KusariSharedModule,

		// libs
		SharedModule.forRoot(intents),
		GeneralModule.forRoot(EMBED_COLOR),
		HealthModule,
		MetricsModule,
		LogsModule,

		// app
		ExternalsModule,
	],
	providers: [
		// commands

		// events
		GuildEvents,
	],
})
export class KusariModule {}
