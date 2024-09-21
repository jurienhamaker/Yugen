import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { Client } from 'discord.js';
import {
	Context,
	Options,
	SlashCommandContext,
	StringOption,
	Subcommand,
} from 'necord';

import { noSettingsReply } from '../../../util/no-settings-reply';
import { GameService } from '../../game/services/game.service';
import { SettingsService } from '../../settings';
import { WordsService } from '../../words/services/words.service';
import { AdminCommandDecorator } from '../admin.decorator';

import { AdminGuard, ForbiddenExceptionFilter } from '@yugen/shared';

class AdminRecreateOptions {
	@StringOption({
		name: 'word',
		description: 'Force a word on a game.',
		required: false,
	})
	word: string | undefined;

	@StringOption({
		name: 'guild',
		description: 'Use a guildId to recreate a game.',
		required: false,
	})
	guildId: string | undefined;
}

@UseGuards(AdminGuard)
@UseFilters(ForbiddenExceptionFilter)
@AdminCommandDecorator()
@Injectable()
export class AdminRecreateCommands {
	constructor(
		private _game: GameService,
		private _settings: SettingsService,
		private _word: WordsService,
		private _client: Client
	) {}

	@Subcommand({
		name: 'recreate-game',
		description: 'Recreate a game.',
	})
	public async start(
		@Context() [interaction]: SlashCommandContext,
		@Options() { word, guildId }: AdminRecreateOptions
	) {
		if (guildId) {
			const guild = await this._client.guilds.fetch(guildId).catch(() => null);
			if (!guild) {
				return interaction.reply({
					content: `Koto could not access specified guild with id \`${guildId}\`.`,
					ephemeral: true,
				});
			}
		}

		const settings = await this._settings.getSettings(
			guildId ?? interaction.guildId
		);

		if (!settings.channelId) {
			return noSettingsReply(interaction, this._client);
		}

		if (word && !this._word.exists(word)) {
			return interaction.reply({
				content: `Word **\`${word}\`** is not available in the database.`,
				ephemeral: true,
			});
		}

		const started = await this._game.start(
			guildId ?? interaction.guildId,
			false,
			true,
			word
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
