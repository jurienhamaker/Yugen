import { getUsername } from '@yugen/koto/util/get-username';
import { Client } from 'discord.js';
import { _getBotAuthor } from '../modules/game/util/get-bot-author';

export const getEmbedFooter = async (
	_client: Client,
	text: string = null,
	voteText = true,
) => {
	const botAuthor = await _getBotAuthor(_client);
	return {
		iconURL: botAuthor.avatarURL(),
		text: `${
			text
				? `${text} | `
				: voteText
					? `Like koto? Please vote using /vote! | `
					: ''
		}Created by @${getUsername(botAuthor)}`,
	};
};
