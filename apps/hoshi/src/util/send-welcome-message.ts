import {
	ActionRowBuilder,
	ButtonBuilder,
	Channel,
	ChannelType,
	Client,
	EmbedBuilder,
} from 'discord.js';

import { getEmbedFooter, kofiButton, supportServerButton } from '@yugen/util';

import { EMBED_COLOR } from './constants';
import { noSettingsDescription } from './no-settings-reply';

export const sendWelcomeMessage = async (channel: Channel, _client: Client) => {
	if (channel.type !== ChannelType.GuildText) {
		return;
	}

	const footer = await getEmbedFooter(_client);
	const embed = new EmbedBuilder()
		.setThumbnail(_client.user.avatarURL())
		.setTitle(`Thank you for inviting Hoshi!`)
		.setDescription(
			`Hoshi has not yet been set up in this server! ${noSettingsDescription}`
		)
		.setColor(EMBED_COLOR)
		.setFooter(footer);

	return channel.send({
		embeds: [embed],
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				kofiButton,
				supportServerButton
			),
		],
	});
};
