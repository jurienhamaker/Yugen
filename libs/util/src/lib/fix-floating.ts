export const fixFloating = (number_: number, precision = 2) => {
	const factor = Math.pow(10, precision);
	return Math.round(number_ * factor) / factor;
};
