import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class GameDictionaryService {
	private readonly _logger = new Logger(GameDictionaryService.name);

	constructor(private _http: HttpService) {}

	public async checkDictionary(word: string) {
		let found = true;
		await lastValueFrom(
			this._http.get(
				`https://en.wiktionary.org/w/api.php?action=opensearch&format=json&formatversion=2&search=${encodeURIComponent(
					word.toLowerCase(),
				)}&namespace=0&limit=2`,
			),
		)
			.then((response) => {
				if (!response.data.length) {
					found = false;
					return;
				}

				const words = response.data[1];

				if (
					!(words instanceof Array) ||
					!words
						.filter((w) => typeof w === 'string')
						.map((w) => w.toLowerCase())
						.includes(word.toLowerCase())
				) {
					found = false;
					return;
				}
			})
			.catch(() => (found = false));

		return found;
	}
}
