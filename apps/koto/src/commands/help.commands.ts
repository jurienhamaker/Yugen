import { Injectable } from '@nestjs/common';
import { Client, EmbedBuilder } from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

import { EMBED_COLOR } from '../util/constants';
import { noSettingsDescription } from '../util/no-settings-reply';

import { getEmbedFooter } from '@yugen/util';

@Injectable()
export class HelpCommands {
	constructor(private _client: Client) {}

	@SlashCommand({
		name: 'help',
		description: 'How to setup the bot!',
	})
	public async invite(@Context() [interaction]: SlashCommandContext) {
		const footer = await getEmbedFooter(this._client);
		const embed = new EmbedBuilder()
			.setTitle(`Koto Setup`)
			.setDescription(
				`${noSettingsDescription}

Want to know how to play the game? Use \`/tutorial\`!`
			)
			.setColor(EMBED_COLOR)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	}
}
