/**
 * Google Gemini provider — thin axios client over the Generative Language REST
 * API. No SDK dependency on purpose: keeps the build small and lets us pin the
 * wire contract exactly.
 *
 * Auth: API key passed as `?key=` query param (Google's documented pattern).
 * Free tier: get a key at https://aistudio.google.com/app/apikey
 *
 * If GEMINI_API_KEY is unset, every call throws 503 with a clear message so
 * the rest of the API can still boot and be exercised without AI configured.
 */

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, isAxiosError } from 'axios';

import { GenerateOptions, LlmProvider } from './llm-provider.interface';

/** Minimal shape of the Gemini `generateContent` response we care about. */
interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

@Injectable()
export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly http: AxiosInstance;
  private readonly apiKey: string;
  private readonly defaultModel: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY') ?? '';
    this.defaultModel = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    this.http = axios.create({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      timeout: 30_000,
    });

    if (!this.apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not set — /api/ai/generate will return 503 until it is configured.',
      );
    }
  }

  async generateText(prompt: string, options: GenerateOptions = {}): Promise<string> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'AI is not configured. Set GEMINI_API_KEY in /app/backend/.env. ' +
          'Free key: https://aistudio.google.com/app/apikey',
      );
    }

    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      // Gemini accepts an optional system-level instruction; only include it
      // when the caller actually supplied one.
      ...(options.systemInstruction && {
        systemInstruction: { parts: [{ text: options.systemInstruction }] },
      }),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 1024,
      },
    };

    try {
      const { data } = await this.http.post<GeminiResponse>(
        `/models/${this.defaultModel}:generateContent`,
        body,
        { params: { key: this.apiKey } },
      );

      // Safety filter blocked the prompt before generation — surface that
      // clearly so the caller can adjust the prompt.
      if (data.promptFeedback?.blockReason) {
        this.logger.warn(`Gemini blocked prompt: ${data.promptFeedback.blockReason}`);
        throw new ServiceUnavailableException(
          `Gemini blocked the request (${data.promptFeedback.blockReason}). Try rephrasing.`,
        );
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new ServiceUnavailableException('Gemini returned an empty response.');
      }
      return text;
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        // Don't dump the user's prompt or our key in logs — only the upstream
        // status code + Google's structured error.
        this.logger.error(
          { status, detail: error.response?.data },
          'Gemini API error',
        );
        if (status === 429) {
          throw new ServiceUnavailableException(
            'Gemini rate limit reached. Try again in a moment.',
          );
        }
        if (status === 400) {
          throw new ServiceUnavailableException(
            'Gemini rejected the request (400). Check GEMINI_MODEL and prompt size.',
          );
        }
        if (status === 401 || status === 403) {
          throw new ServiceUnavailableException(
            'Gemini auth failed. Verify GEMINI_API_KEY is valid.',
          );
        }
        throw new ServiceUnavailableException(`Gemini API error (${status ?? 'network'}).`);
      }
      throw error;
    }
  }
}
