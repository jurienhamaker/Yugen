import { Module } from '@nestjs/common';
import { ExternalsModule } from '@yugen/externals';
import { GeneralModule } from '@yugen/general';
import { HealthModule } from '@yugen/health';
import { LogsModule } from '@yugen/logs';
import { MetricsModule } from '@yugen/metrics';
import { SharedModule } from '@yugen/shared';
import { HelpCommands } from './commands/help.commands';
import { SettingsModule } from './modules/settings';
import { EMBED_COLOR } from './util/constants';
import { intents } from './util/intents';
import { GuildEvents } from './events/guild.events';
import { StarboardModule } from './modules/starboard';

@Module({
	imports: [
		// required
		SettingsModule,

		// libs
		SharedModule.forRoot(intents),
		GeneralModule.forRoot(EMBED_COLOR, () => `*Rewards Coming Soon*`),
		HealthModule,
		MetricsModule,
		LogsModule,
		ExternalsModule,

		// app
		StarboardModule,
	],
	providers: [
		// commands
		HelpCommands,

		// events
		GuildEvents,
	],
})
export class HoshiModule {}
