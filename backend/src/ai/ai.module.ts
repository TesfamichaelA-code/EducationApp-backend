/**
 * AiModule — wires the chosen {@link LlmProvider} behind a single DI token
 * so consumers depend on the contract, not the concrete class.
 *
 * Swap providers later by changing the `useExisting`/`useClass` line below.
 * Nothing else in the app needs to know.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { FlashcardsModule } from '../flashcards/flashcards.module';
import { AiController } from './ai.controller';
import { AiFeaturesService } from './ai-features.service';
import { AiQuotaService } from './ai-quota.service';
import { GeminiProvider } from './providers/gemini.provider';
import { LLM_PROVIDER } from './providers/llm-provider.interface';
import { AiUsage, AiUsageSchema } from './schemas/ai-usage.schema';

@Module({
  imports: [
    ConfigModule,
    FlashcardsModule,
    MongooseModule.forFeature([{ name: AiUsage.name, schema: AiUsageSchema }]),
  ],
  controllers: [AiController],
  providers: [
    GeminiProvider,
    // Bind the abstract token to the concrete provider. Feature modules
    // inject LLM_PROVIDER and stay decoupled from Gemini specifics.
    { provide: LLM_PROVIDER, useExisting: GeminiProvider },
    AiFeaturesService,
    AiQuotaService,
  ],
  exports: [LLM_PROVIDER, GeminiProvider, AiFeaturesService],
})
export class AiModule {}
