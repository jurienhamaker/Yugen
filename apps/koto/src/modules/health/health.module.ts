import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { SharedModule } from '../../shared.module';
import { HealthController } from './controllers/health.controller';
import { DiscordHealthService, PrismaHealthService } from './services';

@Module({
	imports: [SharedModule, HttpModule, TerminusModule],
	controllers: [HealthController],
	providers: [PrismaHealthService, DiscordHealthService],
})
export class HealthModule {}
