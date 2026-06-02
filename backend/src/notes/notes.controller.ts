import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

@ApiTags('notes')
@ApiBearerAuth()
@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a note' })
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateNoteDto) {
    return this.notes.create(user.id, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List my notes' })
  mine(@CurrentUser() user: UserDocument) {
    return this.notes.listMine(user.id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Full-text search across my notes' })
  @ApiQuery({ name: 'q', required: true })
  search(@CurrentUser() user: UserDocument, @Query('q') q: string) {
    return this.notes.search(user.id, q);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Public notes attached to a course' })
  forCourse(@Param('courseId') courseId: string) {
    return this.notes.listPublicForCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note (author only — or public+course)' })
  async findOne(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    const note = await this.notes.findOne(id);
    const isAuthor = note.authorId === user.id;
    const isPublicCourseNote = !note.isPrivate && !!note.courseId;
    if (!isAuthor && !isPublicCourseNote) {
      // Don't leak existence — return 404-equivalent.
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note (author only)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notes.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note (author only)' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    await this.notes.remove(id, user.id);
    return { deleted: true };
  }
}
