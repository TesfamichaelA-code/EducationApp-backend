import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { ReviewDto } from './dto/review.dto';
import { StudyService } from './study.service';

@ApiTags('study')
@ApiBearerAuth()
@Controller('study')
export class StudyController {
  constructor(private readonly study: StudyService) {}

  @Get('next-cards')
  @ApiOperation({
    summary: 'Cards to study — due first, then unseen',
    description:
      'Returns `{ dueNow, newCards }`. Pass `?deckId=` to scope to one deck, otherwise spans every enrolled course.',
  })
  @ApiQuery({ name: 'deckId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  nextCards(
    @CurrentUser() user: UserDocument,
    @Query('deckId') deckId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.study.nextCards(user.id, { deckId, limit });
  }

  @Post('review/:flashcardId')
  @ApiOperation({
    summary: 'Record an SM-2 review (quality 0..5) and advance the schedule',
  })
  review(
    @Param('flashcardId') flashcardId: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: ReviewDto,
  ) {
    return this.study.review(user.id, flashcardId, dto.quality);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Aggregate study stats for the current user' })
  stats(@CurrentUser() user: UserDocument) {
    return this.study.stats(user.id);
  }
}
