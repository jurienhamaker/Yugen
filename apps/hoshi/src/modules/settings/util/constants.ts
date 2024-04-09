export const SETTINGS_CHOICES = [
	{
		name: 'Enabled',
		description: 'Whether starboard module should be enabled or disabled.',
		value: 'enabled',
	},
	{
		name: 'Default channel',
		description: 'The default channel of the starboard.',
		value: 'channelId',
	},
	{
		name: 'Self starring',
		description:
			'Whether the author of the message can star their own messages.',
		value: 'self',
	},
	{
		name: 'Ignored channels',
		description: 'The channels the starboard module ignores.',
		value: 'ignoredChannelIds',
	},
];
