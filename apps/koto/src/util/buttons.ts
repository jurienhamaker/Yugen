import { ButtonBuilder, ButtonStyle } from 'discord.js';

export const supportServerButton = new ButtonBuilder()
	.setURL('https://discord.gg/UttZbEd9zn')
	.setLabel('Join support server 👨‍⚕️')
	.setStyle(ButtonStyle.Link);

export const kofiButton = new ButtonBuilder()
	.setURL(`https://ko-fi.com/jurienhamaker`)
	.setLabel('Open Ko-Fi page ☕')
	.setStyle(ButtonStyle.Link);
