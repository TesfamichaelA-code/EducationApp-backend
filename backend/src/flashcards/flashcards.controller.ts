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
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { FlashcardsService } from './flashcards.service';

@ApiTags('flashcards')
@ApiBearerAuth()
@Controller()
export class FlashcardsController {
  constructor(private readonly flashcards: FlashcardsService) {}

  @Post('decks/:deckId/flashcards')
  @ApiOperation({ summary: 'Add a card to a deck' })
  create(
    @Param('deckId') deckId: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateFlashcardDto,
  ) {
    return this.flashcards.create(user.id, user.role, deckId, dto);
  }

  @Get('decks/:deckId/flashcards')
  @ApiOperation({ summary: 'List cards in a deck' })
  list(@Param('deckId') deckId: string) {
    return this.flashcards.listByDeck(deckId);
  }

  @Get('flashcards/:id')
  @ApiOperation({ summary: 'Get a single card' })
  findOne(@Param('id') id: string) {
    return this.flashcards.findOne(id);
  }

  @Patch('flashcards/:id')
  @ApiOperation({ summary: 'Update a card (owner/admin)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: Partial<CreateFlashcardDto>,
  ) {
    return this.flashcards.update(id, user.id, user.role, dto);
  }

  @Delete('flashcards/:id')
  @ApiOperation({ summary: 'Delete a card (owner/admin)' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    await this.flashcards.remove(id, user.id, user.role);
    return { deleted: true };
  }
}
