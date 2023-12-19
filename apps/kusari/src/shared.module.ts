import { Module } from '@nestjs/common';
import { PrismaModule } from '@yugen/prisma/kusari';
import { SettingsSharedModule } from './modules/settings';

@Module({
	imports: [PrismaModule, SettingsSharedModule],
	exports: [PrismaModule, SettingsSharedModule],
})
export class KusariSharedModule {}
