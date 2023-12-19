import { createCommandGroupDecorator } from 'necord';

export const GameCommandDecorator = createCommandGroupDecorator({
	name: 'game',
	description: 'Game command group',
});
