export const checkAuthorization = (value: string) =>
	value === process.env.WEBHOOK_AUTHORIZATION_TOKEN;
