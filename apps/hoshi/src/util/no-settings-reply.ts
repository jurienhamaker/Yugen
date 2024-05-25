import { getEmbedFooter } from '@yugen/util';
import { Client, CommandInteraction, EmbedBuilder } from 'discord.js';
import { EMBED_COLOR } from './constants';

export const noSettingsDescription = `Someone with \`Manage Server\` permissions must do the following:

- Create a new channel for to serve as a starboard
- Use the \`/starboard add\` command to configure your first starboard

That's it! Hoshi will start keeping a starboard!

**Multiple starboards:**
To add another starboard, use \`/starboard add\`.

*Notes:*
- Hoshi does not *yet* support super reactions!`;

export const noSettingsReply = async (
	interaction: CommandInteraction,
	_client: Client,
) => {
	const footer = await getEmbedFooter(_client);
	const embed = new EmbedBuilder()
		.setTitle('Hoshi Setup')
		.setDescription(
			`Hoshi has not yet been set up in this server! ${noSettingsDescription}`,
		)
		.setColor(EMBED_COLOR)
		.setFooter(footer);

	return interaction.reply({
		embeds: [embed],
	});
};
