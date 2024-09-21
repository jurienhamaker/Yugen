import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Client, PermissionsBitField } from 'discord.js';
import { NecordExecutionContext } from 'necord';

@Injectable()
export class ManageServerGuard implements CanActivate {
	constructor(private _client: Client) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const context_ = NecordExecutionContext.create(context);
		const [interaction] = context_.getContext<'interactionCreate'>();

		if (!interaction) {
			return true;
		}

		if (
			interaction.isUserContextMenuCommand() ||
			interaction.isContextMenuCommand()
		) {
			return false;
		}

		const admins = process.env['OWNER_IDS'].split(',');
		if (admins.includes(interaction?.user?.id)) {
			return true;
		}

		const guild = await this._client.guilds.fetch(interaction.guildId);
		const member = await guild.members.fetch(interaction.user.id);

		const hasAdminPermissions = member.permissions.has(
			PermissionsBitField.Flags.Administrator
		);
		if (hasAdminPermissions) {
			return true;
		}

		const hasPermission = member.permissions.has(
			PermissionsBitField.Flags.ManageGuild
		);
		if (hasPermission) {
			return true;
		}

		return false;
	}
}
