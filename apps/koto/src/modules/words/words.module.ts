import { Module } from '@nestjs/common';
import { KotoSharedModule } from '@yugen/koto/shared.module';
import { WordsService } from './services/words.service';

@Module({
	imports: [KotoSharedModule],
	providers: [WordsService],
	exports: [WordsService],
})
export class WordsModule {}
