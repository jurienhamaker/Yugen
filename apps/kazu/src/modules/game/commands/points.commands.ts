import { Injectable } from '@nestjs/common';
import { getEmbedFooter, getTimestamp } from '@yugen/util';
import { Client, EmbedBuilder } from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';
import { SettingsService } from '../../settings';
import { GameService } from '../services/game.service';
import { GamePointsService } from '../services/points.service';
import { SavesService } from '../../../services/saves.service';

@Injectable()
export class GamePointsCommands {
	constructor(
		private _client: Client,
		private _points: GamePointsService,
		private _saves: SavesService,
		private _game: GameService,
		private _settings: SettingsService,
	) {}

	@SlashCommand({
		name: 'profile',
		description: 'Get your kazu profile!',
	})
	public async profile(@Context() [interaction]: SlashCommandContext) {
		const user = await this._points.getPlayer(
			interaction.guildId,
			interaction.user.id,
		);
		const saves = await this._saves.getPlayer(interaction.user.id);

		return interaction.reply({
			content: `You currently have **${user.points}** points!
And you have **${saves.saves}/2** saves available!`,
		});
	}

	@SlashCommand({
		name: 'points',
		description: 'Get your current points!',
	})
	public async points(@Context() ctx: SlashCommandContext) {
		return this.profile(ctx);
	}

	@SlashCommand({
		name: 'donate-save',
		description: 'Donate a personal save to the server.',
	})
	public async donateSave(@Context() [interaction]: SlashCommandContext) {
		const user = await this._saves.getPlayer(interaction.user.id);

		if (user.saves < 1) {
			return interaction.reply({
				content: `You currently don't have atleast 1 save to donate, you currently have **${user.saves}** saves!`,
				ephemeral: true,
			});
		}

		await this._saves.deductSave(interaction.user.id, 1);
		const { saves, maxSaves } = await this._settings.addSave(
			interaction.guildId,
			0.2,
		);

		return interaction.reply({
			content: `**Save donated!**
The server now has **${saves}/${maxSaves}** saves!`,
			ephemeral: true,
		});
	}

	@SlashCommand({
		name: 'server',
		description: 'Get server information!',
	})
	public async server(@Context() [interaction]: SlashCommandContext) {
		const settings = await this._settings.getSettings(interaction.guildId);
		const currentGame = await this._game.getCurrentGame(
			interaction.guildId,
		);
		const lastNumber = currentGame
			? await this._game.getLastNumber(currentGame)
			: null;

		const footer = await getEmbedFooter(this._client);
		const embed = new EmbedBuilder()
			.setTitle(interaction.guild.name)
			.setThumbnail(interaction.guild.iconURL() ?? null)
			.setDescription(
				`Ongoing game: **${
					currentGame ? `at <#${settings.channelId}>` : 'None'
				}**
High score: **${settings.highscore}${
					settings.highscoreDate
						? ` <t:${getTimestamp(settings.highscoreDate)}:R>`
						: ''
				}**
Last number: **${lastNumber.number}**
Last count by: **${
					lastNumber && lastNumber.userId !== this._client.user.id
						? `<@${lastNumber.userId}>`
						: '-'
				}**
${
	settings.shameRoleId?.length
		? `Last shamed user: <@${settings.lastShameUserId}>
`
		: ''
}
Guild saves: **${settings.saves}/${settings.maxSaves}**
Saves used: **${settings.savesUsed}**
				`,
			)
			.setFooter(footer);

		return interaction.reply({
			content: ``,
			embeds: [embed],
			ephemeral: true,
		});
	}
}
