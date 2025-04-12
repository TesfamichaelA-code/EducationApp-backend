import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FlashcardsController } from './flashcards.controller';
import { FlashcardsService } from './flashcards.service';
import { Flashcard, FlashcardSchema } from './schemas/flashcard.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Flashcard.name, schema: FlashcardSchema }])
  ],
  controllers: [FlashcardsController],
  providers: [FlashcardsService]
})
export class FlashcardsModule {}
