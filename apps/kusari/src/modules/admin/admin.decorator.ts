import { createCommandGroupDecorator } from 'necord';

export const AdminCommandDecorator = createCommandGroupDecorator({
	name: 'admin',
	description: 'Admin command group',
	guilds: [process.env['DEVELOPMENT_SERVER_ID']],
});
