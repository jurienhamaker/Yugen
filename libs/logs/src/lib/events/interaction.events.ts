import { Injectable, Logger } from '@nestjs/common';
import { getInteractionCommandName, getUsername } from '@yugen/util';
import { ChatInputCommandInteraction, Events } from 'discord.js';
import { Context, ContextOf, On } from 'necord';
import { LogsService } from '../services/logs.service';

@Injectable()
export class LogsInteractionEvents {
	private readonly _logger = new Logger(LogsInteractionEvents.name);

	constructor(private _logs: LogsService) {}

	@On(Events.InteractionCreate)
	public onInteractionCreate(
		@Context() [interaction]: ContextOf<Events.InteractionCreate>,
	) {
		const commandName = getInteractionCommandName(interaction);

		if (commandName.indexOf('admin') >= 0) {
			return;
		}

		if (!(interaction instanceof ChatInputCommandInteraction)) {
			return;
		}

		return this._logs.log(
			`Command **${commandName}** used by **${getUsername(
				interaction.user,
			)}** (${interaction.user.id}) in **${interaction.guild.name}** (${
				interaction.guildId
			})!`,
		);
	}
}
