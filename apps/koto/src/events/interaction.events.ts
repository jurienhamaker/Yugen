import { Injectable, Logger } from '@nestjs/common';
import { Events } from 'discord.js';
import { Context, ContextOf, On } from 'necord';
import { getInteractionCommandName } from '../util/get-interaction-command-name';
import { getUsername } from '../util/get-username';

@Injectable()
export class InteractionEvents {
	private readonly _logger = new Logger(InteractionEvents.name);

	@On(Events.InteractionCreate)
	public onInteractionCreate(
		@Context() [interaction]: ContextOf<Events.InteractionCreate>,
	) {
		const commandName = getInteractionCommandName(interaction);

		this._logger.log(
			`Interaction "${commandName}" (${
				interaction.constructor.name
			}) used by ${getUsername(interaction.user)}!`,
		);
	}
}
