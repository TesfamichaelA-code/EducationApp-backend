import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { DecksService } from './decks.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { FlashcardsService } from './flashcards.service';

@ApiTags('decks')
@ApiBearerAuth()
@Controller()
export class DecksController {
  constructor(
    private readonly decks: DecksService,
    private readonly flashcards: FlashcardsService,
  ) {}

  @Post('courses/:courseId/decks')
  @ApiOperation({ summary: 'Create a deck inside a course' })
  create(
    @Param('courseId') courseId: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateDeckDto,
  ) {
    return this.decks.create(user.id, courseId, dto);
  }

  @Get('courses/:courseId/decks')
  @ApiOperation({ summary: 'List decks in a course' })
  listByCourse(@Param('courseId') courseId: string) {
    return this.decks.listByCourse(courseId);
  }

  @Get('decks/:id')
  @ApiOperation({ summary: 'Get a deck (with card count)' })
  async findOne(@Param('id') id: string) {
    const deck = await this.decks.findOne(id);
    const cardCount = await this.flashcards.countByDeck(deck.id);
    return { ...deck.toJSON(), cardCount };
  }

  @Patch('decks/:id')
  @ApiOperation({ summary: 'Update a deck (owner/admin)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: Partial<CreateDeckDto>,
  ) {
    return this.decks.update(id, user.id, user.role, dto);
  }

  @Delete('decks/:id')
  @ApiOperation({ summary: 'Delete a deck (owner/admin)' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    await this.decks.remove(id, user.id, user.role);
    return { deleted: true };
  }
}
