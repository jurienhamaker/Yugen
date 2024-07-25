import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { AdminGuard, ForbiddenExceptionFilter } from '@yugen/shared';
import { AdminCommandDecorator } from '../admin.decorator';
import {
	ActionRowBuilder,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import {
	Context,
	Ctx,
	Modal,
	ModalContext,
	SlashCommandContext,
	Subcommand,
} from 'necord';
import { AdminNotifyService } from '../services/notify.service';

@UseGuards(AdminGuard)
@UseFilters(ForbiddenExceptionFilter)
@AdminCommandDecorator()
@Injectable()
export class AdminNotifyCommands {
	constructor(private _notify: AdminNotifyService) {}

	@Subcommand({
		name: 'notify',
		description: 'Send a notification to the configured channel of the bot',
	})
	public async notify(@Context() [interaction]: SlashCommandContext) {
		const modal = new ModalBuilder()
			.setTitle('Send notification to all guilds')
			.setCustomId(`ADMIN_NOTIFY_SEND`)
			.setComponents([
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
					[
						new TextInputBuilder()
							.setCustomId('message')
							.setLabel('Message to send')
							.setStyle(TextInputStyle.Paragraph),
					],
				),
			]);

		return interaction.showModal(modal);
	}

	@Modal('ADMIN_NOTIFY_SEND')
	public async onNotifyModalResponse(@Ctx() [interaction]: ModalContext) {
		const response = interaction.fields.getTextInputValue('message');
		await interaction.deferReply({ ephemeral: true });

		const { total, successByStarboard, successByBotChannelId } =
			await this._notify.sendNotification(response);

		return interaction.editReply({
			content: `Message sent to ${Math.round(
				successByBotChannelId + successByStarboard,
			)} of ${total} guilds. ${successByBotChannelId} were by \`botUpdatesChannelId\` settings.`,
		});
	}
}
