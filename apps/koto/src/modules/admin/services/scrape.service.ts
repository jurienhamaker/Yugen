import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { delay } from '@yugen/util';
import { AxiosResponse } from 'axios';
import { Channel, ChannelType } from 'discord.js';
import { writeFileSync } from 'fs';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdminScrapeService {
	private readonly _logger = new Logger(AdminScrapeService.name);

	private _baseUrl = `https://api.yourdictionary.com/wordfinder/v1/wordlist?order_by=alpha&dictionary=WL&word_length=6&suggest_links=true&group_by=word_length&has_definition=check&interlink_type=length&special=length`;
	private _offset = 0;
	private _retries = 0;
	private _words = [];

	constructor(private readonly _http: HttpService) {}

	start(channel: Channel) {
		this._words = [];
		this._run(channel);
	}

	private async _run(channel: Channel) {
		if (this._offset > 1) {
			await delay(500);
		}

		this._logger.log(`Starting to scrape from offset ${this._offset}`);

		const response = await firstValueFrom(
			this._http.request({
				url: `${this._baseUrl}&offset=${this._offset}`,
				responseType: 'json',
				headers: {
					Accept: 'application/json',
				},
			}),
		).catch(() => {
			if (this._retries === 5) {
				return this._run(channel);
			}

			this._retries += 1;
			return this._run(channel);
		});

		const { status, data } = response as AxiosResponse;

		if (status !== 200) {
			this._retries += 1;
			return this._run(channel);
		}
		this._retries = 1;

		const amount = await this._parseData(data);
		this._offset += amount;

		if (this._offset < data.data._meta.total) {
			return this._run(channel);
		}

		writeFileSync(
			'/opt/app/src/modules/words/assets/scraped.json',
			JSON.stringify(this._words, null, 2),
		);
		this._words = [];
		this._logger.log(`Finished scraping!`);

		if (channel.type === ChannelType.GuildText) {
			await channel.send(`Finished scraping amigo!`).catch(() => null);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_parseData(data: any) {
		if (!data?.data?._groups?.[0]?._items) {
			return;
		}

		const words = data.data._groups[0]._items;

		this._words = this._words.concat(words);
		this._logger.log(
			`Got ${words.length} from offset ${this._offset}. Total: ${data.data._meta.total}`,
		);

		return words.length;
	}
}
