import { Module } from '@nestjs/common';
import { SharedModule } from '@yugen/koto/shared.module';
import { WordsService } from './services/words.service';

@Module({
	imports: [SharedModule],
	providers: [WordsService],
	exports: [WordsService],
})
export class WordsModule {}
