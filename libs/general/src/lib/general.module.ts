import { DynamicModule, Module } from '@nestjs/common';
import { ColorResolvable } from 'discord.js';
import { GeneralDonateCommands } from './commands/donate.commands';
import { GeneralInviteCommands } from './commands/invite.commands';
import { GeneralSupportCommands } from './commands/support.commands';
import { GeneralVoteCommands } from './commands/vote.commands';
import { AppEvents } from './events/app.events';
import { InteractionEvents } from './events/interaction.events';

@Module({})
export class GeneralModule {
	static forRoot(
		embedColor: ColorResolvable,
		voteReward: () => string,
	): DynamicModule {
		return {
			module: GeneralModule,
			providers: [
				{
					provide: 'EMBED_COLOR',
					useValue: embedColor,
				},
				{
					provide: 'VOTE_REWARD',
					useValue: voteReward,
				},
				// events
				AppEvents,
				InteractionEvents,

				// commands
				GeneralInviteCommands,
				GeneralDonateCommands,
				GeneralSupportCommands,
				GeneralVoteCommands,
			],
		};
	}
}
