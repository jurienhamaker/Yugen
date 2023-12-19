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
		@Inject('PRISMA_SERVICE')
		private readonly prismaService: PrismaClient,
		@Inject('PRISMA_DB_NAME')
		private readonly dbName: string,
	) {
		super();
	}

	async pingCheck(): Promise<HealthIndicatorResult> {
		try {
			await this.prismaService.$queryRaw`SELECT 1`;
			return this.getStatus('database', true, {
				name: this.dbName,
			});
		} catch (e) {
			throw new HealthCheckError('Prisma Health check failed', e);
		}
	}
}
