import { Injectable, UseFilters, UseGuards } from '@nestjs/common';
import { Context, SlashCommandContext, Subcommand } from 'necord';

import { AdminCommandDecorator } from '../admin.decorator';
import { AdminScrapeService } from '../services/scrape.service';

import { AdminGuard, ForbiddenExceptionFilter } from '@yugen/shared';

@UseGuards(AdminGuard)
@UseFilters(ForbiddenExceptionFilter)
@AdminCommandDecorator()
@Injectable()
export class AdminScrapeWordsCommands {
	constructor(private _scrape: AdminScrapeService) {}

	@Subcommand({
		name: 'scrape-words',
		description: 'Scrape words and safe them to a file.',
	})
	public async scrape(@Context() [interaction]: SlashCommandContext) {
		const channel = await interaction.channel.fetch();
		this._scrape.start(channel);

		return interaction.reply({
			content: 'Started scraping process',
			ephemeral: true,
		});
	}
}
