import { Module } from '@nestjs/common';

import { PrismaModule } from '@yugen/prisma/kazu';

import { SettingsSharedModule } from './modules/settings';
import { SavesService } from './services/saves.service';

@Module({
	imports: [PrismaModule, SettingsSharedModule],
	providers: [SavesService],
	exports: [PrismaModule, SettingsSharedModule, SavesService],
})
export class KazuSharedModule {}
