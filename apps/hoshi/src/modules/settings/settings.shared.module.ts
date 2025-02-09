import { Module } from '@nestjs/common';

import { PrismaModule } from '@yugen/prisma/hoshi';

import { SettingsService } from './services';

@Module({
	imports: [PrismaModule],
	controllers: [],
	providers: [SettingsService],
	exports: [SettingsService],
})
export class SettingsSharedModule {}
