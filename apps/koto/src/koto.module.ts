import { Module } from '@nestjs/common';

import { ExternalsModule } from '@yugen/externals';

import { GeneralModule } from '@yugen/general';

import { HealthModule } from '@yugen/health';

import { SharedModule } from '@yugen/shared';

import { LogsModule } from '@yugen/logs';

import { MetricsModule } from '@yugen/metrics';

import { HelpCommands } from './commands/help.commands';
import { TutorialCommands } from './commands/tutorial.commands';
import { AppEvents } from './events/app.events';
import { GuildEvents } from './events/guild.events';
import { AdminModule } from './modules/admin/admin.module';
import { GameModule } from './modules/game/game.module';
import { SettingsModule } from './modules/settings';
import { WordsModule } from './modules/words/words.module';
import { KotoSharedModule } from './shared.module';
import { EMBED_COLOR } from './util/constants';
import { intents } from './util/intents';

@Module({
	imports: [
		// required
		SettingsModule,
		KotoSharedModule,

		// libs
		SharedModule.forRoot(intents),
		GeneralModule.register({
			embedColor: EMBED_COLOR,
			voteReward: () => `*Rewards Coming Soon*`,
		}),
		HealthModule,
		MetricsModule,
		LogsModule,
		ExternalsModule,

		// app
		WordsModule,
		GameModule,
		AdminModule,
	],
	providers: [
		// commands
		TutorialCommands,
		HelpCommands,

		// events
		AppEvents,
		GuildEvents,
	],
})
export class KotoModule {}
