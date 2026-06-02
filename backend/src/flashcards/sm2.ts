/**
 * SM-2 spaced-repetition algorithm — pure, side-effect-free.
 *
 * Reference: P.A. Wozniak, *Optimization of repetition spacing in the practice
 * of learning* (1990). This is the canonical implementation used by Anki and
 * its forks (with minor tweaks).
 *
 * Quality grade `q` is on the 0..5 scale:
 *   0 — total blackout
 *   1 — incorrect; correct answer felt familiar once shown
 *   2 — incorrect; correct answer felt easy once shown
 *   3 — correct, but only after serious difficulty
 *   4 — correct, with hesitation
 *   5 — perfect recall
 *
 * Inputs are clamped, so passing q=7 behaves like q=5 and q=-1 like q=0.
 *
 * Any q < 3 is treated as a *lapse*: repetitions reset to 0 and the card
 * comes back the next day. The ease factor still moves (downward) per the
 * paper's formula.
 *
 * Why no randomness or fuzz factor? Plain SM-2 is deterministic — easy to
 * test and reason about. Adding jitter is a v2 concern.
 */

export interface ReviewInput {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface ReviewOutput extends ReviewInput {
  dueAt: Date;
}

export const INITIAL_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;

export function sm2(state: ReviewInput, quality: number, now: Date = new Date()): ReviewOutput {
  // Clamp + round; protects against malformed payloads.
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let { easeFactor, interval, repetitions } = state;

  if (q < 3) {
    // Lapse — restart the schedule. The next review is tomorrow.
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // EF' = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
  // Clamped at 1.3 so a card never becomes infinitely easy (per the paper).
  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02),
  );

  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + interval);

  return { easeFactor, interval, repetitions, dueAt };
}
