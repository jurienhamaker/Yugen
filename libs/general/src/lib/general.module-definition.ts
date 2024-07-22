import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ColorResolvable } from 'discord.js';

export interface GeneralModuleOptions {
	embedColor: ColorResolvable;
	voteReward?: (userId?: string) => Promise<string> | string;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
	new ConfigurableModuleBuilder<GeneralModuleOptions>().build();
