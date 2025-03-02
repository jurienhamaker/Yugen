import { Injectable } from '@nestjs/common';
import {
	HealthCheckError,
	HealthIndicator,
	HealthIndicatorResult,
} from '@nestjs/terminus';
import { Client, Status } from 'discord.js';

@Injectable()
export class DiscordHealthService extends HealthIndicator {
	constructor(private readonly _client: Client) {
		super();
	}

	async pingCheck(): Promise<HealthIndicatorResult> {
		try {
			const ping = this._client.ws.ping;
			const status = this._client.ws.status !== Status.Disconnected;

			if (!status) {
				throw new Error('No discord status received');
			}

			return {
				ping: {
					status: ping === -1 ? 'down' : 'up',
					value: ping,
				},
				status: {
					status: status ? 'up' : 'down',
				},
			};
		} catch (error) {
			throw new HealthCheckError('Discord Health check failed', error);
		}
	}
}
