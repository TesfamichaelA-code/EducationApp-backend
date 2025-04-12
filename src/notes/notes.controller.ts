import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@ApiTags('notes')
@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@Request() req, @Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(createNoteDto, req.user._id);
  }

  @Get()
  findAll(@Request() req) {
    return this.notesService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.notesService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @Request() req,
  ) {
    return this.notesService.update(id, updateNoteDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.notesService.remove(id, req.user);
  }
}
