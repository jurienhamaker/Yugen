import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';
import { HealthController } from './controllers/health.controller';
import { DiscordHealthService, PrismaHealthService } from './services';

@Module({})
export class HealthModule {
	static forRoot(prismaService: PrismaClient, dbName: string): DynamicModule {
		return {
			module: HealthModule,
			imports: [HttpModule, TerminusModule],
			controllers: [HealthController],
			providers: [
				{
					provide: 'HEALTH_PRISMA_SERVICE',
					useValue: prismaService,
				},
				{
					provide: 'HEALTH_DB_NAME',
					useValue: dbName,
				},
				PrismaHealthService,
				DiscordHealthService,
			],
		};
	}
}
