import { Injectable, Logger } from '@nestjs/common';
import exists from '../assets/exists.json';
import words from '../assets/words.json';

@Injectable()
export class WordsService {
	private readonly _logger = new Logger(WordsService.name);

	private _wordsByLetter: Map<string, string[]>;
	private _cumulativeLetterWeights: Array<number> = [];
	private _existsByLetter: Map<string, string[]>;

	public amount: number = 0;

	constructor() {
		this._logger.log('Initializing words list.');

		this._createMaps();
		this.amount = words.length;

		this._logger.log(
			`Finished initializing words list. Loaded ${exists.length} guess words & ${words.length} game words`,
		);
	}

	exists(word: string) {
		const firstLetter = word[0];
		const set = this._existsByLetter.get(firstLetter);

		if (!set) {
			return false;
		}

		const index = set.findIndex((w) => w === word);
		return index >= 0;
	}

	getRandom(ignored: string[] = [], hard = false) {
		const letter = this._randomLetter();
		const words = (hard ? this._existsByLetter : this._wordsByLetter).get(
			letter,
		);

		const filteredWords = words.filter((w) => ignored.indexOf(w) === -1);

		if (!filteredWords.length) {
			return this.getRandom(ignored, hard);
		}

		const randomIndex = Math.floor(Math.random() * filteredWords.length);
		return filteredWords[randomIndex];
	}

	private _createMaps() {
		console.log(words);
		this._wordsByLetter = ((m, a) => (
			a.forEach((s) => {
				a = m.get(s[0]) || [];
				m.set(s[0], (a.push(s), a));
			}),
			m
		))(new Map(), words);

		const letterSizes = [...this._wordsByLetter.keys()].map(
			(key) => this._wordsByLetter.get(key).length,
		);

		this._cumulativeLetterWeights = [];
		for (let i = 0; i < letterSizes.length; i += 1) {
			this._cumulativeLetterWeights[i] =
				letterSizes[i] + (this._cumulativeLetterWeights[i - 1] || 0);
		}

		this._existsByLetter = ((m, a) => (
			a.forEach((s) => {
				a = m.get(s[0]) || [];
				m.set(s[0], (a.push(s), a));
			}),
			m
		))(new Map(), [...words, ...exists]);
	}

	private _randomLetter() {
		const maxCumulativeWeight =
			this._cumulativeLetterWeights[
				this._cumulativeLetterWeights.length - 1
			];
		const randomNumber = maxCumulativeWeight * Math.random();
		const letters = [...this._wordsByLetter.keys()];

		const index = this._cumulativeLetterWeights.findIndex(
			(v) => v >= randomNumber,
		);

		return letters[index];
	}
}
