import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { ForbiddenExceptionFilter } from '@yugen/koto/filters';
import { AdminGuard } from '@yugen/koto/guards';
import { sendWelcomeMessage } from '@yugen/koto/util/send-welcome-message';
import { ChannelType, Client, PermissionsBitField } from 'discord.js';
import {
	Context,
	Options,
	SlashCommandContext,
	StringOption,
	Subcommand,
} from 'necord';
import { AdminCommandDecorator } from '../admin.decorator';

class AdminSendWelcomeOptions {
	@StringOption({
		name: 'guild',
		description: 'The guildId to target',
		required: true,
	})
	guildId: string;

	@StringOption({
		name: 'channel',
		description: 'The channelId to target',
		required: true,
	})
	channelId: string;
}

@UseGuards(AdminGuard)
@UseFilters(ForbiddenExceptionFilter)
@AdminCommandDecorator()
@Injectable()
export class AdminSendWelcomeCommands {
	constructor(private _client: Client) {}

	@Subcommand({
		name: 'send-welcome',
		description:
			'Send welcome message to specified channel within a guild.',
	})
	public async welcome(
		@Context() [interaction]: SlashCommandContext,
		@Options() { guildId, channelId }: AdminSendWelcomeOptions,
	) {
		const guild = await this._client.guilds
			.fetch(guildId)
			.catch(() => null);
		if (!guild) {
			return interaction.reply({
				content: `Koto could not access specified guild with id \`${guildId}\`.`,
				ephemeral: true,
			});
		}

		const channel = await guild.channels.fetch(channelId).catch(() => null);
		if (!channel) {
			return interaction.reply({
				content: `Koto could not access specified channel with id \`${channelId}\`.`,
				ephemeral: true,
			});
		}

		if (channel.type !== ChannelType.GuildText) {
			return interaction.reply({
				content: `Specified channel is not a Text Channel.`,
				ephemeral: true,
			});
		}

		if (
			!channel
				.permissionsFor(this._client.user)
				.has(PermissionsBitField.Flags.SendMessages)
		) {
			return interaction.reply({
				content: `Koto does not have permissions to post in specified channel.`,
				ephemeral: true,
			});
		}

		const message = await sendWelcomeMessage(channel, this._client);

		return interaction.reply({
			content: `Message has been sent:
https://discord.com/channels/${guildId}/${channelId}/${message.id}`,
			ephemeral: true,
		});
	}
}
