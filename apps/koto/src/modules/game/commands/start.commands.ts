import { Injectable, Logger, UseFilters, UseGuards } from '@nestjs/common';
import { Client, CommandInteraction } from 'discord.js';
import { Context, SlashCommandContext, Subcommand } from 'necord';

import { noSettingsReply } from '../../../util/no-settings-reply';
import { SettingsService } from '../../settings';
import { GameStartGuard } from '../filters/game-start.guard';
import { GameCommandDecorator } from '../game.decorator';
import { GameService } from '../services/game.service';

import { ForbiddenExceptionFilter } from '@yugen/shared';

@UseGuards(GameStartGuard)
@UseFilters(ForbiddenExceptionFilter)
@GameCommandDecorator()
@Injectable()
export class GameStartCommands {
	private readonly _logger = new Logger(GameStartCommands.name);

	constructor(
		private _game: GameService,
		private _settings: SettingsService,
		private _client: Client
	) {}

	@Subcommand({
		name: 'start',
		description: 'Start a game when there is none ongoing.',
	})
	public async start(@Context() [interaction]: SlashCommandContext) {
		return this._startGame(interaction);
	}

	@Subcommand({
		name: 'reset',
		description: 'Reset the current game and any points earned.',
	})
	public async reset(@Context() [interaction]: SlashCommandContext) {
		return this._startGame(interaction, true);
	}

	private async _startGame(
		interaction: CommandInteraction,
		recreate: boolean = false
	) {
		const settings = await this._settings.getSettings(interaction.guildId);

		if (!settings.channelId) {
			this._logger.debug(`No channel ID for for guild ${interaction.guildId}`);
			return noSettingsReply(interaction, this._client);
		}

		const started = await this._game.start(interaction.guildId, true, recreate);

		return interaction.reply({
			content:
				(started
					? 'A game has been started'
					: 'There is already an ongoing game') +
				`${
					settings.channelId === interaction.channelId
						? '.'
						: ` in the <#${settings.channelId}> channel.`
				}`,
			ephemeral: true,
		});
	}
}
