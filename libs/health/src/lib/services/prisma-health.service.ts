import { Inject, Injectable } from '@nestjs/common';
import {
	HealthCheckError,
	HealthIndicator,
	HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaHealthService extends HealthIndicator {
	constructor(
		@Inject('HEALTH_PRISMA_SERVICE')
		private readonly prismaService: PrismaClient,
	) {
		super();
	}

	async pingCheck(databaseName: string): Promise<HealthIndicatorResult> {
		try {
			await this.prismaService.$queryRaw`SELECT 1`;
			return this.getStatus(databaseName, true);
		} catch (e) {
			throw new HealthCheckError('Prisma Health check failed', e);
		}
	}
}
