import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { GameType } from '@prisma/kusari';
import { ForbiddenExceptionFilter, GuildModeratorGuard } from '@yugen/shared';
import { Client, CommandInteraction } from 'discord.js';
import {
	Context,
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

	@StringOption({
		name: 'starting-word',
		required: false,
		description: 'The word the game starts with.',
	})
	startingWord: string;
}

class GameResetOptions {
	@StringOption({
		name: 'starting-word',
		required: false,
		description: 'The word the game starts with.',
	})
	startingWord: string;
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
		@Options() { type, startingWord }: GameStartOptions,
	) {
		return this._startGame(
			interaction,
			type ?? GameType.NORMAL,
			false,
			startingWord,
		);
	}

	@Subcommand({
		name: 'reset',
		description: 'Reset the current game and any points earned.',
	})
	public async reset(
		@Context() [interaction]: SlashCommandContext,
		@Options() { startingWord }: GameResetOptions,
	) {
		const currentGame = await this._game.getCurrentGame(
			interaction.guildId,
		);
		return this._startGame(
			interaction,
			currentGame.type,
			true,
			startingWord,
		);
	}

	private async _startGame(
		interaction: CommandInteraction,
		type: GameType = GameType.NORMAL,
		recreate: boolean = false,
		startingWord: string | undefined,
	) {
		const settings = await this._settings.getSettings(interaction.guildId);

		if (!settings.channelId) {
			return noSettingsReply(interaction, this._client);
		}

		let letter: string;
		if (startingWord?.length) {
			letter = startingWord[startingWord.length - 1];
		}

		if (/[^a-zA-Z]/.test(letter)) {
			// letter is a non alphabetical character
			return interaction.reply({
				content: 'The word must end with an alphabetical character.',
				ephemeral: true,
			});
		}

		const started = await this._game.start(
			interaction.guildId,
			type,
			recreate,
			letter,
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
