export const isPalindrome = (string_: string) => {
	let index = string_.length - 1;
	for (let index_ = 0; index_ < string_.length / 2; index_++) {
		if (string_[index_] != string_[index]) {
			return false;
		}
		index--;
	}

	return true;
};
