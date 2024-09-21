import { Injectable } from '@nestjs/common';
import { Events } from 'discord.js';
import { Once } from 'necord';

import { GameScheduleService } from '../services/schedule.service';

@Injectable()
export class GameClientEvents {
	constructor(private _schedule: GameScheduleService) {}

	@Once(Events.ClientReady)
	public onReady() {
		this._schedule.check();
	}
}
