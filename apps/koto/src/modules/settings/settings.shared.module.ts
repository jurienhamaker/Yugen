import { Module } from '@nestjs/common';
import { PrismaModule } from '@yugen/prisma/koto';
import { SettingsService } from './services';

@Module({
	imports: [PrismaModule],
	controllers: [],
	providers: [SettingsService],
	exports: [SettingsService],
})
export class SettingsSharedModule {}
