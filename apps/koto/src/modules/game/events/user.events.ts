import { Injectable, Logger } from '@nestjs/common';
import { Events } from 'discord.js';
import { Context, ContextOf, Once } from 'necord';
import { GamePointsService } from '../services/points.service';

@Injectable()
export class GameUserEvents {
	private readonly _logger = new Logger(GameUserEvents.name);

	constructor(private _points: GamePointsService) {}

	@Once(Events.GuildMemberAdd)
	public async guildMemberAdd(
		@Context() [member]: ContextOf<Events.GuildMemberAdd>,
	) {
		await this._points.getPlayer(member.guild.id, member.user.id, true);
	}

	@Once(Events.GuildMemberRemove)
	public async guildMemberRemove(
		@Context() [member]: ContextOf<Events.GuildMemberRemove>,
	) {
		await this._points.removePlayerFromGuild(
			member.guild.id,
			member.user.id,
		);
	}
}
