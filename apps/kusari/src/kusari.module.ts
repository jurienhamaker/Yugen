import { Module } from '@nestjs/common';
import { ExternalsModule } from '@yugen/externals';
import { GeneralModule } from '@yugen/general';
import { HealthModule } from '@yugen/health';
import { LogsModule } from '@yugen/logs';
import { MetricsModule } from '@yugen/metrics';
import { SharedModule } from '@yugen/shared';
import { TutorialCommands } from './commands/tutorial.commands';
import { GuildEvents } from './events/guild.events';
import { AdminModule } from './modules/admin/admin.module';
import { GameModule } from './modules/game/game.module';
import { SettingsModule } from './modules/settings';
import { KusariSharedModule } from './shared.module';
import { EMBED_COLOR } from './util/constants';
import { intents } from './util/intents';

@Module({
	imports: [
		SettingsModule,
		KusariSharedModule,

		// libs
		SharedModule.forRoot(intents),
		GeneralModule.forRoot(EMBED_COLOR),
		HealthModule,
		MetricsModule,
		LogsModule,
		ExternalsModule,

		// app
		AdminModule,
		GameModule,
	],
	providers: [
		// commands
		TutorialCommands,

		// events
		GuildEvents,
	],
})
export class KusariModule {}
