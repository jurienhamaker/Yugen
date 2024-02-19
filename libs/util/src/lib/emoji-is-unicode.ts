export const emojiIsUnicode = (emoji: string) =>
	/\p{Extended_Pictographic}/gu.test(emoji);
