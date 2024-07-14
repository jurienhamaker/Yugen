import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { GameType } from '@prisma/kazu';
import { ForbiddenExceptionFilter, GuildModeratorGuard } from '@yugen/shared';
import { Client, CommandInteraction } from 'discord.js';
import {
	Context,
	NumberOption,
	Options,
	SlashCommandContext,
	StringOption,
	Subcommand,
} from 'necord';
import { noSettingsReply } from '../../../util/no-settings-reply';
import { SettingsService } from '../../settings';
import { GameCommandDecorator } from '../game.decorator';
import { GameService } from '../services/game.service';

const GameStartOptionsChoices = [
	{
		name: 'Normal',
		value: 'NORMAL',
	},
];
class GameStartOptions {
	@StringOption({
		name: 'type',
		description: 'The type of game to be played.',
		required: false,
		choices: GameStartOptionsChoices,
	})
	type: GameType;

	@NumberOption({
		name: 'starting-number',
		description: 'The number to start the game at',
		required: false,
	})
	startingNumber: number;
}

class GameResetOptions {
	@NumberOption({
		name: 'starting-number',
		description: 'The number to start the game at',
		required: false,
	})
	startingNumber: number;
}

@UseGuards(GuildModeratorGuard)
@UseFilters(ForbiddenExceptionFilter)
@GameCommandDecorator()
@Injectable()
export class GameStartCommands {
	constructor(
		private _game: GameService,
		private _settings: SettingsService,
		private _client: Client,
	) {}

	@Subcommand({
		name: 'start',
		description: 'Start a game when there is none ongoing.',
	})
	public async start(
		@Context() [interaction]: SlashCommandContext,
		@Options() { type, startingNumber }: GameStartOptions,
	) {
		return this._startGame(
			interaction,
			type ?? GameType.NORMAL,
			startingNumber ?? 1,
		);
	}

	@Subcommand({
		name: 'reset',
		description: 'Reset the current game and any points earned.',
	})
	public async reset(
		@Context() [interaction]: SlashCommandContext,
		@Options() { startingNumber }: GameResetOptions,
	) {
		const currentGame = await this._game.getCurrentGame(
			interaction.guildId,
		);
		return this._startGame(
			interaction,
			currentGame.type,
			startingNumber ?? 1,
			true,
		);
	}

	private async _startGame(
		interaction: CommandInteraction,
		type: GameType = GameType.NORMAL,
		startingNumber: number = 0,
		recreate: boolean = false,
	) {
		const settings = await this._settings.getSettings(interaction.guildId);

		if (!settings.channelId) {
			return noSettingsReply(interaction, this._client);
		}

		const started = await this._game.start(
			interaction.guildId,
			type,
			startingNumber,
			recreate,
		);

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
