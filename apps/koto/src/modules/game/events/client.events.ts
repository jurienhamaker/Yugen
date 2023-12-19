import { Injectable, Logger } from '@nestjs/common';
import { Events } from 'discord.js';
import { Once } from 'necord';
import { GameScheduleService } from '../services/schedule.service';

@Injectable()
export class GameClientEvents {
	private readonly _logger = new Logger(GameClientEvents.name);

	constructor(private _schedule: GameScheduleService) {}

	@Once(Events.ClientReady)
	public onReady() {
		this._schedule.check();
	}
}
