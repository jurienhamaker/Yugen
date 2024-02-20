export const emojiIsUnicode = (emoji: string) =>
	/\p{Extended_Pictographic}/u.test(emoji);
