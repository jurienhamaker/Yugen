import {
	CanActivate,
	ExecutionContext,
	Injectable,
	Logger,
} from '@nestjs/common';
import { Client } from 'discord.js';
import { NecordExecutionContext } from 'necord';

import { SettingsService } from '../../settings';

import { GuildModeratorGuard } from '@yugen/shared';

@Injectable()
export class GameStartGuard extends GuildModeratorGuard implements CanActivate {
	protected override readonly _logger = new Logger(GameStartGuard.name);

	constructor(
		protected override _client: Client,
		private _settings: SettingsService
	) {
		super(_client);
	}

	override async canActivate(context: ExecutionContext): Promise<boolean> {
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

		const settings = await this._settings.getSettings(interaction.guildId);
		if (settings?.membersCanStart) {
			return true;
		}

		return super.canActivate(context);
	}
}
