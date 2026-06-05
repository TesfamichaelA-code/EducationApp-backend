'use client';

import { motion } from 'framer-motion';

interface FlashcardFlipProps {
  question: string;
  answer: string;
  hint?: string;
  isFlipped: boolean;
  onFlip: () => void;
}

/**
 * FlashcardFlip — the visual headliner.
 *
 * 3D rotateY animation via Framer Motion. `transformStyle: preserve-3d` on the
 * outer wrapper + `backfaceVisibility: hidden` on the faces is the canonical
 * recipe for double-sided cards.
 *
 * Respects `prefers-reduced-motion`: Framer Motion will tone down the spring
 * automatically when the user opts out.
 */
export function FlashcardFlip({ question, answer, hint, isFlipped, onFlip }: FlashcardFlipProps) {
  return (
    <div
      className="w-full max-w-3xl"
      style={{ perspective: '1400px' }}
      data-testid="flashcard-wrap"
    >
      <motion.button
        type="button"
        onClick={onFlip}
        aria-label={isFlipped ? 'Show question' : 'Show answer'}
        className="relative w-full aspect-[4/3] cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        data-testid="flashcard-flip-btn"
      >
        {/* ── FRONT — question ────────────────────────────────────────── */}
        <div
          className="absolute inset-0 bg-ink-50 border border-white/15 flex flex-col items-center justify-center p-10 sm:p-16 text-center beam-wrap"
          style={{ backfaceVisibility: 'hidden' }}
          data-testid="flashcard-front"
        >
          <p className="meta mb-8">Question</p>
          <p className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-bone-50">
            {question}
          </p>
          {hint && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-bone-500 italic">
              hint · {hint}
            </p>
          )}
          <p className="absolute top-6 right-6 meta">Press <span className="text-bone-50">Space</span></p>
        </div>

        {/* ── BACK — answer ───────────────────────────────────────────── */}
        <div
          className="absolute inset-0 bg-ink-100 border border-white/15 flex flex-col items-center justify-center p-10 sm:p-16 text-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          data-testid="flashcard-back"
        >
          <p className="meta mb-8">Answer</p>
          <p className="font-sans text-2xl sm:text-3xl leading-snug text-bone-50">
            {answer}
          </p>
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 meta">
            Rate with <span className="text-bone-50">1 2 3 4</span>
          </p>
        </div>
      </motion.button>
    </div>
  );
}
