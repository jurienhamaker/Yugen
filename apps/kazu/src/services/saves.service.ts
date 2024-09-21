import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { isWeekend } from 'date-fns';

import { fixFloating } from '@yugen/util';

import { PrismaService } from '@yugen/prisma/kazu';

@Injectable()
export class SavesService {
	private readonly _logger = new Logger(SavesService.name);

	constructor(private _prisma: PrismaService) {}

	@OnEvent('webhook.vote.received')
	onVote({ userId }: { userId: string }) {
		const saves = isWeekend(new Date()) ? 0.5 : 0.25;
		this._logger.log(
			`Received webhook vote, adding ${saves} saves to ${userId}`
		);
		this.addSave(userId, saves, true);
	}

	async getPlayer(userId: string) {
		let player = await this._prisma.playerSaves.findFirst({
			where: {
				userId,
			},
		});

		if (!player) {
			player = await this._prisma.playerSaves.create({
				data: {
					userId,
				},
			});
		}

		return player;
	}

	async addSave(userId: string, amount: number, isVote: boolean = false) {
		const player = await this.getPlayer(userId);

		if (player.saves == 2) {
			return;
		}

		const updatedSaves = fixFloating(player.saves + amount);
		return this._prisma.playerSaves.update({
			where: {
				id: player.id,
			},
			data: {
				saves: updatedSaves > 2 ? 2 : updatedSaves,
				lastVoteTime: isVote ? new Date() : player.lastVoteTime,
			},
		});
	}

	async deductSave(userId: string, amount: number) {
		const player = await this.getPlayer(userId);

		const updatedSaves = fixFloating(player.saves - amount);
		return this._prisma.playerSaves.update({
			where: {
				id: player.id,
			},
			data: {
				saves: updatedSaves < 0 ? 0 : updatedSaves,
			},
		});
	}
}
