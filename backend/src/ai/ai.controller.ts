/**
 * AI controller — provider-agnostic surface used by feature modules and the
 * Swagger smoke test. Routes:
 *
 *   GET  /api/ai/ping      → heartbeat (no upstream call)
 *   POST /api/ai/generate  → proxy a single text completion (admin only; used
 *                            to verify the Gemini integration after deployment)
 *
 * User-facing AI routes are also capped per user per day via AiQuotaService.
 *
 * In Block C we'll add feature-specific endpoints (flashcard generation,
 * quiz generation) that depend on this same LLM_PROVIDER token.
 */

import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserDocument, UserRole } from '../users/schemas/user.schema';
import { AiFeaturesService } from './ai-features.service';
import { AiQuotaService } from './ai-quota.service';
import { ExplainDto } from './dto/explain.dto';
import { FlashcardsFromTextDto } from './dto/flashcards-from-text.dto';
import { GenerateTextDto } from './dto/generate-text.dto';
import { LLM_PROVIDER, LlmProvider } from './providers/llm-provider.interface';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly features: AiFeaturesService,
    private readonly quota: AiQuotaService,
  ) {}

  @Get('ping')
  @ApiOperation({ summary: 'AI adapter heartbeat (no upstream call)' })
  ping() {
    return { provider: this.llm.name, ready: true };
  }

  /**
   * LLM calls are expensive — cap to 10 req/min/IP regardless of the global
   * throttler default. We'll relax this later for authenticated quotas.
   */
  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Generate text from a prompt (admin smoke test)' })
  @ApiResponse({ status: 200, description: 'Generated text' })
  @ApiResponse({ status: 503, description: 'AI not configured or upstream error' })
  async generate(@Body() dto: GenerateTextDto) {
    const text = await this.llm.generateText(dto.prompt, {
      temperature: dto.temperature,
      maxOutputTokens: dto.maxOutputTokens,
      systemInstruction: dto.systemInstruction,
    });
    return { provider: this.llm.name, text };
  }

  @Post('flashcards/from-text')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({
    summary: 'Generate flashcards from study material; optionally save to a deck (teacher/admin)',
  })
  async flashcardsFromText(
    @CurrentUser() user: UserDocument,
    @Body() dto: FlashcardsFromTextDto,
  ) {
    await this.quota.consume(user.id, user.role);
    return this.features.generateFlashcards(user, dto);
  }

  @Post('explain')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Ask the AI tutor for a concise explanation' })
  async explain(@CurrentUser() user: UserDocument, @Body() dto: ExplainDto) {
    await this.quota.consume(user.id, user.role);
    return this.features.explain(dto);
  }
}
