import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services';

@Global()
@Module({
	providers: [
		PrismaService,
		{
			provide: 'PRISMA_SERVICE',
			useClass: PrismaService,
		},
		{
			provide: 'PRISMA_DB_NAME',
			useValue: 'koto',
		},
	],
	exports: [PrismaService, 'PRISMA_SERVICE', 'PRISMA_DB_NAME'],
})
export class PrismaModule {}
