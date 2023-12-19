import { Snowflake } from 'discord.js';

export interface TopGGBody {
	bot: Snowflake;
	user: Snowflake;
	type: 'upvote' | 'test';
	isWeekend: boolean;
	query?: string;
}
