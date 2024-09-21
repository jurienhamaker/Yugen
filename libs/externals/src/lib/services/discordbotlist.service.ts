import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Client, Events } from 'discord.js';
import { CommandsService, Once } from 'necord';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class DiscordBotListService {
	private readonly _logger = new Logger(DiscordBotListService.name);

	constructor(
		private _client: Client,
		private _http: HttpService,
		private _commands: CommandsService
	) {}

	@Once(Events.ClientReady)
	public async onReady() {
		await this._sendCommands();
		await this.sendInformation();
	}

	@Cron('0 */30 * * * *')
	public async sendInformation() {
		if (
			process.env['DISCORDBOTLIST_TOKEN'] &&
			process.env['NODE_ENV'] === 'production'
		) {
			await lastValueFrom(
				this._http.post(
					`https://discordbotlist.com/api/v1/bots/${process.env['CLIENT_ID']}/stats`,
					{
						guilds: this._client.guilds.cache.size,
						users: this._client.users.cache.size,
					},
					{
						headers: {
							Authorization: process.env['DISCORDBOTLIST_TOKEN'],
						},
					}
				)
			).catch(error =>
				this._logger.error(
					`Error sending information to DiscordBotList`,
					error.stack
				)
			);

			this._logger.log(`Updated DiscordBotList stats`);
		}
	}

	private async _sendCommands() {
		if (
			process.env['DISCORDBOTLIST_TOKEN'] &&
			process.env['NODE_ENV'] === 'production'
		) {
			const commands = this._commands.getCommands();

			const data = [];
			for (const command of commands) {
				if (command.isSlashCommand()) {
					if (command.getName() === 'admin') {
						continue;
					}

					data.push({
						name: command.getName(),
						description: command.getDescription(),
						type: 1,
					});
					continue;
				}
			}

			await lastValueFrom(
				this._http.post(
					`https://discordbotlist.com/api/v1/bots/${process.env['CLIENT_ID']}/commands`,
					data,
					{
						headers: {
							Authorization: process.env['DISCORDBOTLIST_TOKEN'],
						},
					}
				)
			).catch(error =>
				this._logger.error(
					`Error sending commands to DiscordBotList`,
					error.stack
				)
			);

			this._logger.log(`Updated DiscordBotList with ${data.length} commands`);
		}
	}
}
