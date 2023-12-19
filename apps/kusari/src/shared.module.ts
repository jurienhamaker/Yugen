import { Module } from '@nestjs/common';
import { PrismaModule } from '@yugen/prisma/kusari';

@Module({
	imports: [PrismaModule],
	exports: [PrismaModule],
})
export class KusariSharedModule {}
