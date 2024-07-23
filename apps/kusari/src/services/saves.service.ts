import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@yugen/prisma/kusari';
import { fixFloating } from '@yugen/util';
import { isWeekend } from 'date-fns';

@Injectable()
export class SavesService {
	private readonly _logger = new Logger(SavesService.name);

	constructor(private _prisma: PrismaService) {}

	@OnEvent('webhook.vote.received')
	onVote({ userId }: { userId }) {
		const saves = isWeekend(new Date()) ? 0.5 : 0.25;
		this._logger.log(
			`Received webhook vote, adding ${saves} saves to ${userId}`,
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

		const newSaves = fixFloating(player.saves + amount);
		return this._prisma.playerSaves.update({
			where: {
				id: player.id,
			},
			data: {
				saves: newSaves > 2 ? 2 : newSaves,
				lastVoteTime: isVote ? new Date() : player.lastVoteTime,
			},
		});
	}

	async deductSave(userId: string, amount: number) {
		const player = await this.getPlayer(userId);

		const newSave = fixFloating(player.saves - amount);
		return this._prisma.playerSaves.update({
			where: {
				id: player.id,
			},
			data: {
				saves: newSave < 0 ? 0 : newSave,
			},
		});
	}
}
