/**
 * AiFeaturesService — domain-aware wrappers around the generic LLM provider.
 *
 * Each method composes a strict prompt, calls the provider, and post-processes
 * the response. Prompts are deliberately verbose: explicit instructions reduce
 * the rate at which Gemini sneaks markdown fences or apologetic preambles into
 * structured outputs.
 */

import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { FlashcardsService } from '../flashcards/flashcards.service';
import { UserDocument } from '../users/schemas/user.schema';
import { ExplainDto } from './dto/explain.dto';
import { FlashcardsFromTextDto } from './dto/flashcards-from-text.dto';
import { LLM_PROVIDER, LlmProvider } from './providers/llm-provider.interface';

export interface GeneratedCard {
  question: string;
  answer: string;
  hint?: string;
}

@Injectable()
export class AiFeaturesService {
  private readonly logger = new Logger(AiFeaturesService.name);

  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly flashcards: FlashcardsService,
  ) {}

  /**
   * Generate flashcards from a chunk of study material.
   * If `deckId` is provided, the cards are persisted into that deck
   * (the caller must own it — checked by FlashcardsService.createMany).
   */
  async generateFlashcards(user: UserDocument, dto: FlashcardsFromTextDto): Promise<{
    generated: number;
    cards: GeneratedCard[];
    savedTo: string | null;
  }> {
    const count = Math.min(Math.max(dto.count ?? 10, 1), 30);
    const prompt = buildFlashcardPrompt(dto.text, count);
    const raw = await this.llm.generateText(prompt, {
      temperature: 0.4,
      maxOutputTokens: 4_096,
    });
    const cards = this.parseFlashcardArray(raw, count);

    let savedTo: string | null = null;
    if (dto.deckId) {
      await this.flashcards.createMany(user.id, user.role, dto.deckId, cards);
      savedTo = dto.deckId;
    }

    return { generated: cards.length, cards, savedTo };
  }

  /**
   * Conversational explanation — short tutor responses optionally biased by a
   * course/topic context.
   */
  async explain(dto: ExplainDto): Promise<{ answer: string }> {
    const system = dto.context
      ? `You are a friendly study tutor helping a learner with the topic: "${dto.context}". ` +
        `Explain clearly, use concrete examples, and avoid jargon unless you define it. ` +
        `Keep responses under 200 words.`
      : `You are a friendly study tutor. Explain clearly, use concrete examples, ` +
        `and avoid jargon unless you define it. Keep responses under 200 words.`;

    const answer = await this.llm.generateText(dto.question, {
      systemInstruction: system,
      temperature: 0.6,
      maxOutputTokens: 1_024,
    });
    return { answer: answer.trim() };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private parseFlashcardArray(raw: string, expected: number): GeneratedCard[] {
    const stripped = stripMarkdownFences(raw);
    let parsed: unknown;
    try {
      parsed = JSON.parse(stripped);
    } catch {
      // Sometimes the model precedes/follows the JSON with prose. Find the
      // first balanced array and try that.
      const match = stripped.match(/\[[\s\S]*\]/);
      if (!match) {
        this.logger.error({ raw }, 'AI response was not parseable JSON');
        throw new ServiceUnavailableException('AI returned an unparseable response');
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch (e) {
        this.logger.error({ raw, err: e }, 'AI JSON salvage failed');
        throw new ServiceUnavailableException('AI returned malformed JSON');
      }
    }
    if (!Array.isArray(parsed)) {
      throw new ServiceUnavailableException('AI did not return an array');
    }

    const cards: GeneratedCard[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).question === 'string' &&
        typeof (item as Record<string, unknown>).answer === 'string'
      ) {
        const obj = item as Record<string, string>;
        cards.push({
          question: obj.question.trim().slice(0, 1_000),
          answer: obj.answer.trim().slice(0, 2_000),
          hint: typeof obj.hint === 'string' ? obj.hint.trim().slice(0, 500) : undefined,
        });
      }
    }
    if (cards.length === 0) {
      throw new ServiceUnavailableException('AI returned no usable cards');
    }
    // Trim to the count the caller asked for (model sometimes overshoots).
    return cards.slice(0, expected);
  }
}

function stripMarkdownFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
}

function buildFlashcardPrompt(material: string, count: number): string {
  return (
    `Generate exactly ${count} flashcard question-answer pairs from the study material below.\n\n` +
    `STRICT OUTPUT RULES:\n` +
    `• Output ONLY a valid JSON array. No preamble, no commentary, no markdown fences.\n` +
    `• Each element has shape: {"question": "...", "answer": "...", "hint": "..."}\n` +
    `• "hint" is optional — include only when a short nudge would meaningfully help.\n` +
    `• Each question tests understanding, not rote keyword recall.\n` +
    `• Each answer is at most three sentences.\n\n` +
    `STUDY MATERIAL:\n${material}`
  );
}
