import { Injectable, Logger } from '@nestjs/common';
import { ActivityType, Client, Events } from 'discord.js';
import { Context, ContextOf, Once } from 'necord';

@Injectable()
export class AppEvents {
	private readonly _logger = new Logger(AppEvents.name);

	@Once(Events.ClientReady)
	public onReady(@Context() [client]: ContextOf<Events.ClientReady>) {
		this._setPresence(client);
	}

	private _setPresence(client: Client) {
		client.user!.setPresence({
			activities: [
				{
					name: `to the ✨`,
					type: ActivityType.Listening,
				},
			],
		});

		if (process.env['HOSHI_AVATAR_URL']) {
			client.user
				.setAvatar(process.env['HOSHI_AVATAR_URL'])
				.then((u) =>
					this._logger.log(`Set client avatar to ${u.avatarURL()}`),
				)
				.catch(() => this._logger.warn('Failed to set bot avatar'));
		}
	}
}
