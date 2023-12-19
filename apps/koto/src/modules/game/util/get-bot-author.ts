import { Client } from 'discord.js';

export const _getBotAuthor = async (_client: Client) => {
	return _client.users.fetch(process.env.OWNER_IDS.split(',')[0]);
};
