import { NestFactory } from '@nestjs/core';

export async function bootstrap(module: unknown) {
	const app = await NestFactory.create(module, {
		cors: true,
		...(process.env['NODE_ENV'] === 'production'
			? {
					logger: ['error', 'warn', 'log'],
			  }
			: {}),
	});

	app.setGlobalPrefix('api');
	await app.listen(3000);
}
