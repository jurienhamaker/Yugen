import { Game, Guess } from '@prisma/koto';

export enum GAME_TYPE {
	CORRECT = 'CORRECT',
	ALMOST = 'ALMOST',
	WRONG = 'WRONG',
	DEFAULT = 'DEFAULT',
}
export interface GameGuessMeta {
	type: GAME_TYPE;
	points?: number;
	letter: string;
}

export interface GameMeta {
	keyboard: {
		[key: string]: GAME_TYPE;
	};
	word: {
		index: number;
		letter: string;
		type: GAME_TYPE;
	}[];
	discovery: {
		almost: {
			[key: string]: number;
		};
		correct: {
			[key: string]: number;
		};
	};
}

export type GameWithMeta = Game & { meta: GameMeta };
export type GameWithMetaAndGuesses = Game & { meta: GameMeta } & {
	guesses: Guess[];
};
