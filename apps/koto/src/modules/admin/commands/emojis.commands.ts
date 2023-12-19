import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { AdminGuard, ForbiddenExceptionFilter } from '@yugen/shared';
import { Client } from 'discord.js';
import { Context, SlashCommandContext, Subcommand } from 'necord';
import { AdminCommandDecorator } from '../admin.decorator';

@UseGuards(AdminGuard)
@UseFilters(ForbiddenExceptionFilter)
@AdminCommandDecorator()
@Injectable()
export class AdminEmojisCommands {
	constructor(private _client: Client) {}

	@Subcommand({
		name: 'emojis',
		description: 'Get emojis data.',
	})
	public async getEmojis(@Context() [interaction]: SlashCommandContext) {
		const guilds = await this._client.guilds.fetch();
		const letterGuilds = [
			...guilds
				.filter(
					(g) =>
						g.name.startsWith('Koto Letters') &&
						g.name.endsWith('Rounded'),
				)
				.values(),
		].map((g) => g.id);

		const emojis = this._client.emojis.cache.filter(
			(e) => letterGuilds.indexOf(e.guild.id) !== -1,
		);

		const data = {};

		for (const emoji of emojis.values()) {
			const parsedName = emoji.name.replace('letter', '');
			let letter = parsedName[0].toLowerCase();
			let type = parsedName
				.split('')
				.splice(1, parsedName.length - 1)
				.join('')
				.toUpperCase();

			if (emoji.name.startsWith('blank')) {
				letter = 'blank';
				type = emoji.name.replace('blank', '').toUpperCase();
			}

			if (!data[type]) {
				data[type] = {};
			}

			if (!data[type][letter]) {
				data[type][letter] = {
					name: emoji.name,
					id: emoji.id,
				};
			}
		}

		console.log(JSON.stringify(data, null, 2));

		return interaction.reply({
			content: 'Data output can be found in the logs.',
			ephemeral: true,
		});
	}
}
