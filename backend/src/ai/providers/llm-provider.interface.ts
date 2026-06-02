/**
 * Provider-agnostic LLM contract.
 *
 * Every concrete provider (Gemini today, OpenAI/Claude tomorrow if needed)
 * implements this interface. Consumers depend on the {@link LLM_PROVIDER}
 * token, never on a concrete class — that's what makes the swap surgical.
 */

export interface GenerateOptions {
  /** 0.0 (deterministic) to 2.0 (chaotic). Default: 0.7. */
  temperature?: number;
  /** Hard cap on generated tokens. Default: 1024. */
  maxOutputTokens?: number;
  /**
   * System-level instruction (persona, output rules) applied before the user
   * prompt. Treated as a single message in Gemini's `systemInstruction` field.
   */
  systemInstruction?: string;
}

export interface LlmProvider {
  /** Human-readable provider identifier (e.g. "gemini"). */
  readonly name: string;

  /**
   * Generates a single text completion. Implementations MUST throw a
   * {@link ServiceUnavailableException} on upstream failure so the global
   * exception filter returns a clean 503 to the client.
   */
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
}

/** DI token used to inject whichever LlmProvider the AiModule is currently wired to. */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
