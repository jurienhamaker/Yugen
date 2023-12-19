import { Controller, Get, Inject } from '@nestjs/common';
import {
	DiskHealthIndicator,
	HealthCheck,
	HealthCheckService,
	HttpHealthIndicator,
	MemoryHealthIndicator,
} from '@nestjs/terminus';
import { DiscordHealthService } from '../services/discord-health.service';
import { PrismaHealthService } from '../services/prisma-health.service';

@Controller('health')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private http: HttpHealthIndicator,
		@Inject(PrismaHealthService)
		private db: PrismaHealthService,
		@Inject(DiscordHealthService)
		private discord: DiscordHealthService,
		private disk: DiskHealthIndicator,
		private memory: MemoryHealthIndicator,
		@Inject('HEALTH_DB_NAME')
		private dbName: string,
	) {}

	@Get()
	@HealthCheck()
	check() {
		return this.health.check([
			() =>
				this.http.pingCheck(
					'basic check',
					'http://localhost:3000/api/health/ping',
					{
						timeout: 100,
					},
				),
			() =>
				this.disk.checkStorage('diskStorage', {
					thresholdPercent: 0.5,
					path: '/',
				}),
			() => this.db.pingCheck(this.dbName),
			() => this.discord.pingCheck(),
			() => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
			() => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

			// Mongoose for MongoDB check
			// Redis check
		]);
	}

	@Get('ping')
	ping() {
		return 'pong!';
	}
}
