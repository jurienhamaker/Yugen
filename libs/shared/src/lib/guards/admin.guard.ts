import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { NecordExecutionContext } from 'necord';

@Injectable()
export class AdminGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
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
		if (!admins.includes(interaction.user.id)) {
			return false;
		}

		return true;
	}
}
