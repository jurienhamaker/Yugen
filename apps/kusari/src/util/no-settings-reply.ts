import { EMBED_COLOR } from '@yugen/kusari/util/constants';
import { getEmbedFooter } from '@yugen/util';
import { Client, CommandInteraction, EmbedBuilder } from 'discord.js';

export const noSettingsDescription = `Kusari has not yet been set up in this server! Someone with \`Manage Server\` permissions must do the following:
    
- Create a new channel where Kusari will be played
- Use the \`/settings channel\` command to configure the channel
- Start the first game using \`/game start\`!

That's it! Have fun playing!`;

export const noSettingsReply = async (
	interaction: CommandInteraction,
	_client: Client,
) => {
	const footer = await getEmbedFooter(_client);
	const embed = new EmbedBuilder()
		.setTitle('Kusari Setup')
		.setDescription(noSettingsDescription)
		.setColor(EMBED_COLOR)
		.setFooter(footer);

	return interaction.reply({
		embeds: [embed],
	});
};
