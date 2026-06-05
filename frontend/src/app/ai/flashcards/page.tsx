'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { AuthGuard } from '@/components/auth-guard';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import type { Course, Deck } from '@/lib/types';

interface GeneratedCard {
  question: string;
  answer: string;
  hint?: string;
}

export default function AiFlashcardsPage() {
  return (
    <AuthGuard>
      <Header />
      <main className="pt-16">
        <AiFlashcards />
      </main>
    </AuthGuard>
  );
}

function AiFlashcards() {
  const router = useRouter();
  const search = useSearchParams();
  const presetCourseId = search.get('courseId');

  const [text, setText] = useState('');
  const [count, setCount] = useState(8);
  const [courseId, setCourseId] = useState(presetCourseId ?? '');
  const [deckId, setDeckId] = useState('');
  const [preview, setPreview] = useState<GeneratedCard[] | null>(null);
  const [savedTo, setSavedTo] = useState<string | null>(null);

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'mine'],
    queryFn: async () => (await api.get<Course[]>('/courses/mine')).data,
  });

  const { data: decks = [] } = useQuery({
    queryKey: ['course-decks', courseId],
    queryFn: async () => (await api.get<Deck[]>(`/courses/${courseId}/decks`)).data,
    enabled: !!courseId,
  });

  const generate = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { text, count };
      if (deckId) body.deckId = deckId;
      const { data } = await api.post<{
        generated: number;
        cards: GeneratedCard[];
        savedTo: string | null;
      }>('/ai/flashcards/from-text', body);
      return data;
    },
    onSuccess: (data) => {
      setPreview(data.cards);
      setSavedTo(data.savedTo);
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="meta mb-4">AI · Gemini</p>
      <h1 className="font-display text-5xl font-bold tracking-tight mb-3" data-testid="ai-title">
        Cards from any text.
      </h1>
      <p className="font-sans text-bone-200 max-w-2xl mb-12">
        Paste study material below. Gemini drafts conceptual question/answer pairs in seconds.
        Pick a deck to save them straight into your course, or just preview first.
      </p>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-px bg-white/10">
        {/* Input pane */}
        <section className="bg-ink-50 p-8" data-testid="ai-form">
          <form
            onSubmit={(e) => { e.preventDefault(); generate.mutate(); }}
            className="space-y-6"
          >
            <div>
              <Label htmlFor="material">Study material</Label>
              <textarea
                id="material"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                rows={14}
                className="w-full bg-ink-100 border border-white/10 px-3 py-3 font-mono text-sm text-bone-50 placeholder:text-bone-500 focus-visible:outline-none focus-visible:border-bone-50"
                placeholder="Photosynthesis is the process by which..."
                data-testid="ai-text"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="count"># of cards</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={30}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  data-testid="ai-count"
                />
              </div>
              <div>
                <Label htmlFor="course">Course (optional)</Label>
                <select
                  id="course"
                  value={courseId}
                  onChange={(e) => { setCourseId(e.target.value); setDeckId(''); }}
                  className="w-full h-11 bg-ink-100 border border-white/10 px-3 font-mono text-sm"
                  data-testid="ai-course-select"
                >
                  <option value="">— Preview only —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="deck">Deck (optional)</Label>
                <select
                  id="deck"
                  value={deckId}
                  onChange={(e) => setDeckId(e.target.value)}
                  disabled={!courseId}
                  className="w-full h-11 bg-ink-100 border border-white/10 px-3 font-mono text-sm disabled:opacity-40"
                  data-testid="ai-deck-select"
                >
                  <option value="">— Preview only —</option>
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={generate.isPending || text.length < 20}
              className="w-full beam-wrap"
              data-testid="ai-generate-btn"
            >
              {generate.isPending ? 'Calling Gemini…' : '🤖 Generate flashcards'}
            </Button>

            {generate.isError && (
              <p className="font-mono text-xs text-anki-again" data-testid="ai-error">
                {(generate.error as any)?.response?.data?.message ?? 'Generation failed'}
              </p>
            )}
          </form>
        </section>

        {/* Preview pane */}
        <aside className="bg-ink-50 p-8" data-testid="ai-preview">
          <p className="meta mb-4">Preview</p>
          {preview === null ? (
            <p className="font-sans text-bone-500">
              Generated cards will appear here.
            </p>
          ) : (
            <div className="space-y-5">
              {savedTo && (
                <p className="font-mono text-xs text-anki-good" data-testid="ai-saved-banner">
                  ✓ Saved {preview.length} card{preview.length !== 1 && 's'} into deck.
                </p>
              )}
              <ul className="space-y-4" data-testid="ai-preview-list">
                {preview.map((c, i) => (
                  <li key={i} className="border border-white/8 p-4" data-testid={`preview-card-${i}`}>
                    <p className="meta mb-2">Q · {String(i + 1).padStart(2, '0')}</p>
                    <p className="font-sans text-bone-50 mb-3">{c.question}</p>
                    <p className="meta mb-2">A</p>
                    <p className="font-sans text-bone-200">{c.answer}</p>
                    {c.hint && (
                      <p className="font-mono text-xs text-bone-500 italic mt-3">hint · {c.hint}</p>
                    )}
                  </li>
                ))}
              </ul>
              {savedTo && deckId && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/decks/${deckId}`)}
                  className="w-full"
                  data-testid="ai-goto-deck-btn"
                >
                  Open the deck →
                </Button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
