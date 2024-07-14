import { Injectable } from '@nestjs/common';
import { getEmbedFooter } from '@yugen/util';
import { Client, EmbedBuilder } from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';
import { EMBED_COLOR } from '../util/constants';

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
- A single person can not send in a word twice in a row!
- That's it! Enjoy!

**Saves:**
You can earn saves by voting for Kusari! Each vote is worth 0.25 save & 0.5 on the weekends!
A save can also be donated to the server, this will increase the server saves for collaborative save system.
Donating a save will turn 1 personal save into 0.2 server saves.

**Server Settings:**
- Channel, specify a dedicated channel
- Cooldown, specify a cooldown before users can add a word again`,
			)
			.setColor(EMBED_COLOR)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
		});
	}
}
