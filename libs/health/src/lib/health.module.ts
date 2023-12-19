import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller';
import { DiscordHealthService, PrismaHealthService } from './services';

@Module({
	imports: [HttpModule, TerminusModule],
	controllers: [HealthController],
	providers: [PrismaHealthService, DiscordHealthService],
})
export class HealthModule {}
