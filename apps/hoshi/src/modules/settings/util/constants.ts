export const SETTINGS_CHOICES = [
	{
		name: 'Threshold',
		description:
			'The amount of "emojis" required to be added to the starboard.',
		value: 'threshold',
	},
	{
		name: 'Self starring',
		description:
			'Whether the author of the message can star their own messages.',
		value: 'self',
	},
	{
		name: 'Bot updates channel',
		description: 'A channel the bot can send updates to.',
		value: 'botUpdatesChannelId',
	},
	{
		name: 'Ignored channels',
		description: 'The channels the starboard module ignores.',
		value: 'ignoredChannelIds',
	},
];
