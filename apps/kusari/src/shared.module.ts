import { Module } from '@nestjs/common';
import { PrismaModule } from '@yugen/prisma/kusari';
import { SettingsSharedModule } from './modules/settings';
import { SavesService } from './services/saves.service';

@Module({
	imports: [PrismaModule, SettingsSharedModule],
	providers: [SavesService],
	exports: [PrismaModule, SettingsSharedModule, SavesService],
})
export class KusariSharedModule {}
