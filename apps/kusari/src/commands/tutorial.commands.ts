import { Injectable } from '@nestjs/common';
import { EMBED_COLOR } from '@yugen/kusari/util/constants';
import { getEmbedFooter } from '@yugen/util';
import { Client, EmbedBuilder } from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class TutorialCommands {
	constructor(private _client: Client) {}

	@SlashCommand({
		name: 'tutorial',
		description: 'The rules of the game!',
	})
	public async invite(@Context() [interaction]: SlashCommandContext) {
		const footer = await getEmbedFooter(this._client);
		const embed = new EmbedBuilder()
			.setTitle(`Kusari Tutorial`)
			.setDescription(
				`**How to Play:**
- The first word can be any word
- Each word afterwards has to start with the last letter of the previous word
- That's it! Enjoy!

**Server Settings:**
- Channel, specify a dedicated channel`,
			)
			.setColor(EMBED_COLOR)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
		});
	}
}
