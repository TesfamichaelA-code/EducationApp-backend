'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { AuthGuard } from '@/components/auth-guard';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Deck, Flashcard } from '@/lib/types';

export default function DeckDetailPage() {
  return (
    <AuthGuard>
      <Header />
      <main className="pt-16">
        <DeckDetail />
      </main>
    </AuthGuard>
  );
}

function DeckDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: deck } = useQuery({
    queryKey: ['deck', params.id],
    queryFn: async () =>
      (await api.get<Deck & { cardCount: number }>(`/decks/${params.id}`)).data,
  });

  const { data: cards = [] } = useQuery({
    queryKey: ['deck-cards', params.id],
    queryFn: async () =>
      (await api.get<Flashcard[]>(`/decks/${params.id}/flashcards`)).data,
  });

  const isOwnerOrAdmin = user && deck && (user.id === deck.ownerId || user.role === 'admin');

  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [hint, setHint] = useState('');

  const addCard = useMutation({
    mutationFn: async () => {
      await api.post(`/decks/${params.id}/flashcards`, { question: q, answer: a, hint });
    },
    onSuccess: () => {
      setQ(''); setA(''); setHint('');
      setAdding(false);
      void qc.invalidateQueries({ queryKey: ['deck-cards', params.id] });
      void qc.invalidateQueries({ queryKey: ['deck', params.id] });
    },
  });

  if (!deck) {
    return <p className="meta px-6 py-16" data-testid="deck-loading">Loading deck…</p>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="meta mb-4">Deck</p>
      <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
        <h1 className="font-display text-5xl font-bold tracking-tight" data-testid="deck-title">
          {deck.name}
        </h1>
        <Button
          size="lg"
          onClick={() => router.push(`/study/${deck.id}`)}
          disabled={cards.length === 0}
          data-testid="start-study-btn"
        >
          Start study session →
        </Button>
      </div>
      <p className="font-sans text-bone-200 max-w-3xl leading-relaxed mb-12">
        {deck.description || '—'}
      </p>

      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <p className="meta">{cards.length} card{cards.length !== 1 && 's'}</p>
        {isOwnerOrAdmin && (
          <Button onClick={() => setAdding((v) => !v)} data-testid="new-card-btn">
            {adding ? 'Cancel' : '+ New card'}
          </Button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={(e) => { e.preventDefault(); addCard.mutate(); }}
          className="bg-ink-50 border border-white/10 p-6 mb-8 grid gap-4"
          data-testid="new-card-form"
        >
          <div>
            <Label htmlFor="q">Question</Label>
            <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} required data-testid="new-card-question" />
          </div>
          <div>
            <Label htmlFor="a">Answer</Label>
            <Input id="a" value={a} onChange={(e) => setA(e.target.value)} required data-testid="new-card-answer" />
          </div>
          <div>
            <Label htmlFor="h">Hint (optional)</Label>
            <Input id="h" value={hint} onChange={(e) => setHint(e.target.value)} data-testid="new-card-hint" />
          </div>
          <Button type="submit" disabled={addCard.isPending || !q || !a} data-testid="new-card-submit">
            {addCard.isPending ? '…' : 'Add card'}
          </Button>
        </form>
      )}

      {cards.length === 0 ? (
        <p className="font-sans text-bone-200" data-testid="empty-cards">No cards yet — add some above or use the AI generator.</p>
      ) : (
        <ul className="border border-white/10 divide-y divide-white/8" data-testid="card-list">
          {cards.map((c, i) => (
            <li key={c.id} className="grid grid-cols-[60px_1fr_1fr] gap-6 px-6 py-5" data-testid={`card-row-${c.id}`}>
              <p className="font-mono text-xs text-bone-500 tracking-meta">{String(i + 1).padStart(2, '0')}</p>
              <p className="font-sans text-bone-50">{c.question}</p>
              <p className="font-sans text-bone-200">{c.answer}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
