import { Module } from '@nestjs/common';

import { ExternalsModule } from '@yugen/externals';

import { GeneralModule } from '@yugen/general';

import { HealthModule } from '@yugen/health';

import { SharedModule } from '@yugen/shared';

import { LogsModule } from '@yugen/logs';

import { MetricsModule } from '@yugen/metrics';

import { HelpCommands } from './commands/help.commands';
import { AppEvents } from './events/app.events';
import { GuildEvents } from './events/guild.events';
import { AdminModule } from './modules/admin/admin.module';
import { SettingsModule } from './modules/settings';
import { StarboardModule } from './modules/starboard';
import { EMBED_COLOR } from './util/constants';
import { intents } from './util/intents';

@Module({
	imports: [
		// required
		SettingsModule,

		// libs
		SharedModule.forRoot(intents),
		GeneralModule.register({
			embedColor: EMBED_COLOR,
			voteReward: () => null,
		}),
		HealthModule,
		MetricsModule,
		LogsModule,
		ExternalsModule,

		// app
		AdminModule,
		StarboardModule,
	],
	providers: [
		// commands
		HelpCommands,

		// events
		AppEvents,
		GuildEvents,
	],
})
export class HoshiModule {}
