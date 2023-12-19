import { Module } from '@nestjs/common';
import { ExternalsModule } from '@yugen/externals';
import { GeneralModule } from '@yugen/general';
import { HealthModule } from '@yugen/health';
import { LogsModule } from '@yugen/logs';
import { MetricsModule } from '@yugen/metrics';
import { PrismaService } from '@yugen/prisma/kusari';
import { SharedModule } from '@yugen/shared';
import { GuildEvents } from './events/guild.events';
import { KusariSharedModule } from './shared.module';
import { EMBED_COLOR } from './util/constants';
import { intents } from './util/intents';

@Module({
	imports: [
		// libs
		SharedModule.forRoot(intents),
		GeneralModule.forRoot(EMBED_COLOR),
		HealthModule.forRoot(PrismaService, 'kusari'),
		MetricsModule,
		LogsModule,

		// app
		KusariSharedModule,
		ExternalsModule,
	],
	providers: [
		// commands

		// events
		GuildEvents,
	],
})
export class KusariModule {}
