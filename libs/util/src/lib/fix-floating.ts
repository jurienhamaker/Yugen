export const fixFloating = (num: number, precision = 2) => {
	const factor = Math.pow(10, precision);
	return Math.round(num * factor) / factor;
};
