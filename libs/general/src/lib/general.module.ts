import { Module } from '@nestjs/common';

import { GeneralDonateCommands } from './commands/donate.commands';
import { GeneralInviteCommands } from './commands/invite.commands';
import { GeneralSupportCommands } from './commands/support.commands';
import { GeneralVoteCommands } from './commands/vote.commands';
import { AppEvents } from './events/app.events';
import { InteractionEvents } from './events/interaction.events';
import { ConfigurableModuleClass } from './general.module-definition';

@Module({
	providers: [
		// events
		AppEvents,
		InteractionEvents,

		// commands
		GeneralInviteCommands,
		GeneralDonateCommands,
		GeneralSupportCommands,
		GeneralVoteCommands,
	],
})
export class GeneralModule extends ConfigurableModuleClass {}
