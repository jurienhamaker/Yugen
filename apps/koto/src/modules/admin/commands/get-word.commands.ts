import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { Client } from 'discord.js';
import {
	Context,
	Options,
	SlashCommandContext,
	StringOption,
	Subcommand,
} from 'necord';

import { GameService } from '../../game/services/game.service';
import { AdminCommandDecorator } from '../admin.decorator';

import { AdminGuard, ForbiddenExceptionFilter } from '@yugen/shared';

class AdminGetWordOptions {
	@StringOption({
		name: 'guild',
		description: 'The guildId to target',
		required: true,
	})
	guildId: string;
}

@UseGuards(AdminGuard)
@UseFilters(ForbiddenExceptionFilter)
@AdminCommandDecorator()
@Injectable()
export class AdminGetWordCommands {
	constructor(private _client: Client, private _game: GameService) {}

	@Subcommand({
		name: 'get-word',
		description: "Get the current game's answer.",
	})
	public async welcome(
		@Context() [interaction]: SlashCommandContext,
		@Options() { guildId }: AdminGetWordOptions
	) {
		const guild = await this._client.guilds.fetch(guildId).catch(() => null);
		if (!guild) {
			return interaction.reply({
				content: `Koto could not access specified guild with id \`${guildId}\`.`,
				ephemeral: true,
			});
		}

		const game = await this._game.getCurrentGame(guildId);
		if (!game) {
			return interaction.reply({
				content: `Guild currently has no game running.`,
				ephemeral: true,
			});
		}

		return interaction.reply({
			content: `The answer for the current game is: **${game.word}**`,
			ephemeral: true,
		});
	}
}
