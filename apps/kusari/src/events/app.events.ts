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
					name: `${client.user!.displayName} 📖`,
					type: ActivityType.Playing,
				},
			],
		});
	}
}
