import { LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

export async function bootstrap(module: unknown) {
	const app = await NestFactory.create(module, {
		cors: true,
		...(process.env['NODE_ENV'] === 'production'
			? {
					logger: [
						'error',
						'warn',
						'log',
						...((process.env['DEBUG'] ? ['debug'] : []) as LogLevel[]),
					],
			  }
			: {}),
	});

	app.setGlobalPrefix('api');
	await app.listen(3000);
}
