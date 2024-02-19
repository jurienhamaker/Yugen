import {
	CanActivate,
	ExecutionContext,
	Injectable,
	Logger,
} from '@nestjs/common';
import { NecordExecutionContext } from 'necord';
import { SettingsService } from '../../settings';
import { ModuleNotEnabledException } from '@yugen/util';

@Injectable()
export class StarboardEnabledGuard implements CanActivate {
	private readonly _logger = new Logger(StarboardEnabledGuard.name);

	constructor(private readonly _settings: SettingsService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const ctx = NecordExecutionContext.create(context);
		const [interaction] = ctx.getContext<'interactionCreate'>();
		// if (!interaction.isChatInputCommand()) return false;

		const admins = process.env.OWNER_IDS!.split(',');
		if (admins.includes(interaction.user.id)) {
			return true;
		}

		const settings = await this._settings.getSettings(interaction.guildId!);

		if (!settings?.enabled) {
			throw new ModuleNotEnabledException('Starboard');
		}

		return true;
	}
}
