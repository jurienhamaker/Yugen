import { Injectable } from '@nestjs/common';
import { EMBED_COLOR } from '@yugen/hoshi/util/constants';
import { noSettingsDescription } from '@yugen/hoshi/util/no-settings-reply';
import { getEmbedFooter } from '@yugen/util';
import { Client, EmbedBuilder } from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

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
			.setTitle(`Hoshi Setup`)
			.setDescription(noSettingsDescription)
			.setColor(EMBED_COLOR)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	}
}
