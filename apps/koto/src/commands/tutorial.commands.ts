import { Injectable } from '@nestjs/common';
import { SettingsService } from '@yugen/koto/modules/settings';
import { EMBED_COLOR } from '@yugen/koto/util/constants';
import { noSettingsReply } from '@yugen/koto/util/no-settings-reply';
import { formatMinutes, getEmbedFooter } from '@yugen/util';
import { Client, EmbedBuilder } from 'discord.js';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class TutorialCommands {
	constructor(
		private _client: Client,
		private _settings: SettingsService,
	) {}

	@SlashCommand({
		name: 'tutorial',
		description: 'The rules of the game!',
	})
	public async invite(@Context() [interaction]: SlashCommandContext) {
		const settings = await this._settings.getSettings(interaction.guildId);

		if (!settings.channelId) {
			return noSettingsReply(interaction, this._client);
		}

		const frequencyFormatted = formatMinutes(settings.frequency);
		const timeLimitFormatted = formatMinutes(settings.timeLimit);

		const footer = await getEmbedFooter(this._client);
		const embed = new EmbedBuilder()
			.setTitle(`Koto Tutorial`)
			.setDescription(
				`**How to Play:**
- Each guess must be a valid 6 letter word in the Koto words list.
- Points are awarded for each **new** discovery
- Type <any valid 6 letter word> to make a guess (no prefix needed, but you can prefix it with \`!\` if you are a Co-ordle veteran)
- You only have 9 guesses per Koto game, so be careful!

**Server Settings:**
- There is a cooldown of **${settings.cooldown}** minutes between guesses
- A new game is posted every **${
					frequencyFormatted.hours
						? `${frequencyFormatted.hours} hour${
								frequencyFormatted.hours === 1 ? '' : 's'
							}`
						: ''
				}${
					frequencyFormatted.hours && frequencyFormatted.minutes
						? ' & '
						: ''
				}${
					frequencyFormatted.minutes
						? `${frequencyFormatted.minutes} minute${
								frequencyFormatted.minutes === 1 ? '' : 's'
							}`
						: ''
				}**.
- The time limit of each game is **${
					timeLimitFormatted.hours
						? `${timeLimitFormatted.hours} hour${
								timeLimitFormatted.hours === 1 ? '' : 's'
							}`
						: ''
				}${
					timeLimitFormatted.hours && timeLimitFormatted.minutes
						? ' & '
						: ''
				}${
					timeLimitFormatted.minutes
						? `${timeLimitFormatted.minutes} minute${
								timeLimitFormatted.minutes === 1 ? '' : 's'
							}`
						: ''
				}**.
- A game will ${
					settings.autoStart ? '' : 'not '
				}be automatically started after the previous one has ended 

**Point Rewards:**
- 1 point for finding a yellow letter
- 1 point for turning a yellow letter green
- 2 points for finding a green letter
- 2 points to everyone who participated (if Koto is solved)`,
			)
			.setColor(EMBED_COLOR)
			.setFooter(footer);

		return interaction.reply({
			embeds: [embed],
		});
	}
}
