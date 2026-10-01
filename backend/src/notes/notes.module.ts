import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { Note, NoteSchema } from './schemas/note.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Note.name, schema: NoteSchema }]),
    EnrollmentsModule,
  ],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
