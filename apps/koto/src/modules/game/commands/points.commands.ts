import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

import { GamePointsService } from '../services/points.service';

@Injectable()
export class GamePointsCommands {
	constructor(private _points: GamePointsService) {}

	@SlashCommand({
		name: 'points',
		description: 'Get your current points!',
	})
	public async points(@Context() [interaction]: SlashCommandContext) {
		const user = await this._points.getPlayer(
			interaction.guildId,
			interaction.user.id
		);

		return interaction.reply({
			content: `You currently have **${user.points}** points!

Participated in **${user.participated}** games.
And you finished **${user.wins}** games with the correct guess!`,
			ephemeral: true,
		});
	}
}
