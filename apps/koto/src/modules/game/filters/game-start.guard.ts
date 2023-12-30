import {
	CanActivate,
	ExecutionContext,
	Injectable,
	Logger,
} from '@nestjs/common';
import { GuildModeratorGuard } from '@yugen/shared';
import { Client } from 'discord.js';
import { NecordExecutionContext } from 'necord';
import { SettingsService } from '../../settings';

@Injectable()
export class GameStartGuard extends GuildModeratorGuard implements CanActivate {
	protected readonly _logger = new Logger(GameStartGuard.name);

	constructor(
		protected _client: Client,
		private _settings: SettingsService,
	) {
		super(_client);
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const ctx = NecordExecutionContext.create(context);
		const [interaction] = ctx.getContext<'interactionCreate'>();

		if (!interaction) {
			return true;
		}

		if (
			interaction.isUserContextMenuCommand() ||
			interaction.isContextMenuCommand()
		) {
			return false;
		}

		const settings = await this._settings.getSettings(interaction.guildId);
		if (settings?.membersCanStart) {
			return true;
		}

		return super.canActivate(context);
	}
}
