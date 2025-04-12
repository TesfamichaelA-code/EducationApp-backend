import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('flashcards')
@Controller('flashcards')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(@Request() req, @Body() createFlashcardDto: CreateFlashcardDto) {
    return this.flashcardsService.create(createFlashcardDto, req.user._id);
  }

  @Get()
  findAll(@Request() req) {
    return this.flashcardsService.findAll(req.user);
  }

  @Get('course/:courseId')
  findByCourse(@Param('courseId') courseId: string) {
    return this.flashcardsService.findByCourse(courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flashcardsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateFlashcardDto: any, @Request() req) {
    return this.flashcardsService.update(id, updateFlashcardDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.flashcardsService.remove(id, req.user);
  }
}