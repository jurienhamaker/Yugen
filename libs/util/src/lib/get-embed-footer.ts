import { getBotAuthor } from './get-bot-author';
import { Client } from 'discord.js';
import { getUsername } from './get-username';

export const getEmbedFooter = async (
	_client: Client,
	text: string | null = null,
	voteText = true,
) => {
	const botAuthor = await getBotAuthor(_client);
	return {
		iconURL: botAuthor.avatarURL(),
		text: `${
			text
				? `${text} | `
				: voteText
					? `Like ${_client.user?.displayName}? Please vote using /vote! | `
					: ''
		}Created by @${getUsername(botAuthor)}`,
	};
};
