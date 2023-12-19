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
				`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
			),
		).catch(() => (found = false));

		return found;
	}
}
