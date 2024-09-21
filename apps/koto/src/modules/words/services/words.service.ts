import { Injectable, Logger } from '@nestjs/common';

import exists from '../assets/exists.json';
import words from '../assets/words.json';

@Injectable()
export class WordsService {
	private readonly _logger = new Logger(WordsService.name);

	private _wordsByLetter: Map<string, string[]>;
	private _cumulativeLetterWeights: Array<number> = [];
	private _existsByLetter: Map<string, string[]>;

	public amount = 0;

	constructor() {
		this._logger.log('Initializing words list.');

		this._createMaps();
		this.amount = words.length;

		this._logger.log(
			`Finished initializing words list. Loaded ${exists.length} guess words & ${words.length} game words`
		);
	}

	exists(word: string) {
		const firstLetter = word[0];
		const set = this._existsByLetter.get(firstLetter);

		if (!set) {
			return false;
		}

		const index = set.indexOf(word);
		return index >= 0;
	}

	getRandom(ignored: string[] = [], hard = false) {
		const letter = this._randomLetter();
		const words = (hard ? this._existsByLetter : this._wordsByLetter).get(
			letter
		);

		const filteredWords = words.filter(w => !ignored.includes(w));

		if (filteredWords.length === 0) {
			return this.getRandom(ignored, hard);
		}

		const randomIndex = Math.floor(Math.random() * filteredWords.length);
		return filteredWords[randomIndex];
	}

	private _createMaps() {
		this._wordsByLetter = this._wordsToMap(words);

		const letterSizes = [...this._wordsByLetter.keys()].map(
			key => this._wordsByLetter.get(key).length
		);

		this._cumulativeLetterWeights = [];
		for (const [index, letterSize] of letterSizes.entries()) {
			this._cumulativeLetterWeights[index] =
				letterSize + (this._cumulativeLetterWeights[index - 1] || 0);
		}

		this._existsByLetter = this._wordsToMap([...words, ...exists]);
	}

	private _randomLetter() {
		const maxCumulativeWeight = this._cumulativeLetterWeights.at(-1);
		const randomNumber = maxCumulativeWeight * Math.random();
		const letters = [...this._wordsByLetter.keys()];

		const index = this._cumulativeLetterWeights.findIndex(
			v => v >= randomNumber
		);

		return letters[index];
	}

	private _wordsToMap(words: string[]) {
		const map = new Map<string, string[]>();

		for (const word of words) {
			const wordsArray = map.get(word[0]) || [];
			map.set(word[0], (wordsArray.push(word), wordsArray));
		}

		return map;
	}
}
