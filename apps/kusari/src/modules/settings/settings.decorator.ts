import { createCommandGroupDecorator } from 'necord';

export const SettingsCommandDecorator = createCommandGroupDecorator({
	name: 'settings',
	description: 'Settings command group',
});
