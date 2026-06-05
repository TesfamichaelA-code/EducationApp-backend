'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AuthGuard } from '@/components/auth-guard';
import { FlashcardFlip } from '@/components/flashcard-flip';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { Flashcard, NextCardsResponse, ReviewState } from '@/lib/types';

/**
 * Study mode — the headliner. Full-screen, pure black, no chrome.
 *
 * Keyboard map (per design guidelines):
 *   Space / Enter  — flip the card
 *   1              — Again (quality 1, lapse)
 *   2              — Hard  (quality 3)
 *   3              — Good  (quality 4)
 *   4              — Easy  (quality 5)
 *
 * Cards are pulled once into local memory at session start (the SM-2 schedule
 * doesn't change mid-session). On every review we POST to /study/review and
 * advance the local index — no need to refetch.
 */
export default function StudyPage() {
  return (
    <AuthGuard>
      <Study />
    </AuthGuard>
  );
}

const ANKI_TO_QUALITY: Record<1 | 2 | 3 | 4, number> = {
  1: 1, // Again
  2: 3, // Hard
  3: 4, // Good
  4: 5, // Easy
};

function Study() {
  const params = useParams<{ deckId: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['next-cards', params.deckId],
    queryFn: async () => {
      const { data } = await api.get<NextCardsResponse>(
        `/study/next-cards?deckId=${params.deckId}&limit=50`,
      );
      return data;
    },
  });

  const queue = useMemo<Flashcard[]>(() => {
    if (!data) return [];
    return [...data.dueNow.map((d) => d.card), ...data.newCards];
  }, [data]);

  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [tally, setTally] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [done, setDone] = useState(false);

  // When the data lands, queue gains length; if it's empty, jump to done state.
  useEffect(() => {
    if (data && queue.length === 0) setDone(true);
  }, [data, queue.length]);

  const current = queue[index];

  const reviewMutation = useMutation({
    mutationFn: async ({ id, quality }: { id: string; quality: number }) =>
      (await api.post<ReviewState>(`/study/review/${id}`, { quality })).data,
  });

  const handleRate = useCallback(
    (key: 1 | 2 | 3 | 4) => {
      if (!isFlipped || !current || reviewMutation.isPending) return;
      const quality = ANKI_TO_QUALITY[key];
      reviewMutation.mutate({ id: current.id, quality });
      setTally((t) => {
        const bucket = key === 1 ? 'again' : key === 2 ? 'hard' : key === 3 ? 'good' : 'easy';
        return { ...t, [bucket]: t[bucket] + 1 };
      });
      // Advance immediately — the optimistic UX is the whole point.
      if (index + 1 >= queue.length) setDone(true);
      else setIndex((i) => i + 1);
      setIsFlipped(false);
    },
    [isFlipped, current, reviewMutation, index, queue.length],
  );

  // Keyboard control
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        e.preventDefault();
        handleRate(Number(e.code.slice(-1)) as 1 | 2 | 3 | 4);
      } else if (e.code === 'Escape') {
        router.back();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRate, done, router]);

  // ── End-of-session screen ────────────────────────────────────────────────
  if (done) {
    const total = tally.again + tally.hard + tally.good + tally.easy;
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full text-center"
          data-testid="study-complete"
        >
          <p className="meta mb-4">Session complete</p>
          <h1 className="font-display text-5xl sm:text-7xl font-extrabold tracking-tighter mb-12 leading-none">
            {total > 0 ? 'Done.' : 'Nothing due.'}
          </h1>

          {total > 0 && (
            <div className="grid grid-cols-4 gap-px bg-white/10 mb-12">
              <Bucket label="Again" value={tally.again} color="text-anki-again" />
              <Bucket label="Hard"  value={tally.hard}  color="text-anki-hard" />
              <Bucket label="Good"  value={tally.good}  color="text-anki-good" />
              <Bucket label="Easy"  value={tally.easy}  color="text-anki-easy" />
            </div>
          )}

          <div className="flex justify-center gap-3">
            <Button size="lg" onClick={() => router.push(`/decks/${params.deckId}`)} data-testid="exit-deck-btn">
              Back to deck
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/dashboard')} data-testid="exit-dashboard-btn">
              Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading || !current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="meta" data-testid="study-loading">Loading cards…</p>
      </div>
    );
  }

  // ── Active study ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black flex flex-col" data-testid="study-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5">
        <button
          onClick={() => router.back()}
          className="meta hover:text-bone-50 transition-colors"
          data-testid="study-exit-btn"
        >
          ← Esc to exit
        </button>
        <div className="meta">
          Card <span className="text-bone-50">{String(index + 1).padStart(2, '0')}</span>
          {' '}/{' '}
          <span className="text-bone-50">{String(queue.length).padStart(2, '0')}</span>
        </div>
        <div className="meta">{params.deckId.slice(-6)}</div>
      </div>

      {/* Progress beam */}
      <div className="h-px bg-white/8 mx-6">
        <motion.div
          className="h-full bg-bone-50"
          initial={false}
          animate={{ width: `${(index / queue.length) * 100}%` }}
          transition={{ duration: 0.4 }}
          data-testid="study-progress"
        />
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <FlashcardFlip
          question={current.question}
          answer={current.answer}
          hint={current.hint}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped((f) => !f)}
        />
      </div>

      {/* Rating row */}
      <div className="px-6 pb-10">
        {!isFlipped ? (
          <div className="text-center meta" data-testid="study-flip-hint">
            Flip the card to rate it
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-px bg-white/10 max-w-3xl mx-auto" data-testid="study-rating-row">
            <Rate label="Again" hotkey="1" variant="anki_again" onClick={() => handleRate(1)} />
            <Rate label="Hard"  hotkey="2" variant="anki_hard"  onClick={() => handleRate(2)} />
            <Rate label="Good"  hotkey="3" variant="anki_good"  onClick={() => handleRate(3)} />
            <Rate label="Easy"  hotkey="4" variant="anki_easy"  onClick={() => handleRate(4)} />
          </div>
        )}
      </div>
    </div>
  );
}

function Rate({
  label,
  hotkey,
  variant,
  onClick,
}: {
  label: string;
  hotkey: string;
  variant: 'anki_again' | 'anki_hard' | 'anki_good' | 'anki_easy';
  onClick: () => void;
}) {
  return (
    <Button
      variant={variant}
      size="lg"
      onClick={onClick}
      className="h-16 flex-col gap-1 rounded-none"
      data-testid={`rate-${label.toLowerCase()}`}
    >
      <span className="font-display text-2xl font-bold tracking-tight">{label}</span>
      <span className="text-[10px] opacity-70">[{hotkey}]</span>
    </Button>
  );
}

function Bucket({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-ink-50 py-8">
      <p className="meta mb-3">{label}</p>
      <p className={`font-display text-5xl font-bold ${color}`} data-testid={`bucket-${label.toLowerCase()}`}>
        {value}
      </p>
    </div>
  );
}
