import { Module } from '@nestjs/common';
import { addHours, isWeekend } from 'date-fns';

import { ExternalsModule } from '@yugen/externals';

import { GeneralModule } from '@yugen/general';

import { HealthModule } from '@yugen/health';

import { SharedModule } from '@yugen/shared';

import { getTimestamp } from '@yugen/util';

import { LogsModule } from '@yugen/logs';

import { MetricsModule } from '@yugen/metrics';

import { HelpCommands } from './commands/help.commands';
import { TutorialCommands } from './commands/tutorial.commands';
import { AppEvents } from './events/app.events';
import { GuildEvents } from './events/guild.events';
import { AdminModule } from './modules/admin/admin.module';
import { GameModule } from './modules/game/game.module';
import { SettingsModule } from './modules/settings';
import { SavesService } from './services/saves.service';
import { KusariSharedModule } from './shared.module';
import { EMBED_COLOR } from './util/constants';
import { intents } from './util/intents';


@Module({
	imports: [
		SettingsModule,
		KusariSharedModule,

		// libs
		SharedModule.forRoot(intents),
		GeneralModule.registerAsync({
			imports: [KusariSharedModule],
			useFactory: (_saves: SavesService) => {
				return {
					embedColor: EMBED_COLOR,
					voteReward: async userId => {
						const player = await _saves.getPlayer(userId);
						const lastVoteTime = player?.lastVoteTime ?? null;

						return `You will receive **${
							isWeekend(new Date()) ? '0.5' : '0.25'
						}** saves for **each vote**.

You can vote ${
							lastVoteTime
								? `again **<t:${getTimestamp(addHours(lastVoteTime, 12))}:R>**`
								: '**right now**!'
						}`;
					},
				};
			},
			inject: [SavesService],
		}),
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
export class KusariModule {}
