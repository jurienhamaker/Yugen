import { Injectable } from '@nestjs/common';
import { ChatInputCommandInteraction, Events } from 'discord.js';
import { Context, ContextOf, On } from 'necord';

import { LogsService } from '../services/logs.service';

import { getInteractionCommandName, getUsername } from '@yugen/util';

@Injectable()
export class LogsInteractionEvents {
	constructor(private _logs: LogsService) {}

	@On(Events.InteractionCreate)
	public onInteractionCreate(
		@Context() [interaction]: ContextOf<Events.InteractionCreate>
	) {
		const commandName = getInteractionCommandName(interaction);

		if (commandName.includes('admin')) {
			return;
		}

		if (!(interaction instanceof ChatInputCommandInteraction)) {
			return;
		}

		return this._logs.log(
			`Command **${commandName}** used by **${getUsername(
				interaction.user
			)}** (${interaction.user.id}) in **${interaction.guild.name}** (${
				interaction.guildId
			})!`
		);
	}
}
