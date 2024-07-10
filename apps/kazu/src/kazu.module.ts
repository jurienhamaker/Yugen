import { Module } from '@nestjs/common';
import { ExternalsModule } from '@yugen/externals';
import { GeneralModule } from '@yugen/general';
import { HealthModule } from '@yugen/health';
import { LogsModule } from '@yugen/logs';
import { MetricsModule } from '@yugen/metrics';
import { SharedModule } from '@yugen/shared';
import { isWeekend } from 'date-fns';
import { HelpCommands } from './commands/help.commands';
import { TutorialCommands } from './commands/tutorial.commands';
import { AppEvents } from './events/app.events';
import { GuildEvents } from './events/guild.events';
import { AdminModule } from './modules/admin/admin.module';
import { GameModule } from './modules/game/game.module';
import { SettingsModule } from './modules/settings';
import { KazuSharedModule } from './shared.module';
import { EMBED_COLOR } from './util/constants';
import { intents } from './util/intents';

@Module({
	imports: [
		SettingsModule,
		KazuSharedModule,

		// libs
		SharedModule.forRoot(intents),
		GeneralModule.forRoot(
			EMBED_COLOR,
			() =>
				`You will receive **${
					isWeekend(new Date()) ? '0.5' : '0.25'
				}** saves for **each vote**.`,
		),
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
		HelpCommands,

		// events
		AppEvents,
		GuildEvents,
	],
})
export class KazuModule {}
