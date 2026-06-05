'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { AuthGuard } from '@/components/auth-guard';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Course, Deck } from '@/lib/types';

export default function CourseDetailPage() {
  return (
    <AuthGuard>
      <Header />
      <main className="pt-16">
        <CourseDetail />
      </main>
    </AuthGuard>
  );
}

function CourseDetail() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ['course', params.id],
    queryFn: async () => (await api.get<Course>(`/courses/${params.id}`)).data,
  });

  const { data: decks = [] } = useQuery({
    queryKey: ['course-decks', params.id],
    queryFn: async () =>
      (await api.get<Deck[]>(`/courses/${params.id}/decks`)).data,
  });

  const isOwnerOrAdmin = user && course && (user.id === course.teacherId || user.role === 'admin');

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const createDeck = useMutation({
    mutationFn: async () => {
      await api.post(`/courses/${params.id}/decks`, { name, description: desc });
    },
    onSuccess: () => {
      setName('');
      setDesc('');
      setCreating(false);
      void qc.invalidateQueries({ queryKey: ['course-decks', params.id] });
    },
  });

  if (!course) {
    return <p className="meta px-6 py-16" data-testid="course-loading">Loading course…</p>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="meta mb-4">{course.category}</p>
      <div className="flex items-start justify-between gap-6 flex-wrap mb-12">
        <h1 className="font-display text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl" data-testid="course-title">
          {course.title}
        </h1>
        <div className="text-right">
          <p className="meta mb-2">Invite code</p>
          <p
            className="font-mono text-2xl font-medium select-all cursor-pointer hover:text-bone-200"
            onClick={() => navigator.clipboard?.writeText(course.inviteCode)}
            data-testid="course-invite-code"
            title="Click to copy"
          >
            {course.inviteCode}
          </p>
        </div>
      </div>
      <p className="font-sans text-bone-200 max-w-3xl leading-relaxed mb-12">
        {course.description || 'No description.'}
      </p>

      {/* Decks ─────────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <p className="meta">02 / Decks</p>
          {isOwnerOrAdmin && (
            <div className="flex gap-3">
              <Button asChild variant="outline" data-testid="ai-flashcards-link">
                <Link href={`/ai/flashcards?courseId=${course.id}`}>🤖 AI flashcards</Link>
              </Button>
              <Button onClick={() => setCreating((v) => !v)} data-testid="new-deck-btn">
                {creating ? 'Cancel' : '+ New deck'}
              </Button>
            </div>
          )}
        </div>

        {creating && (
          <form
            onSubmit={(e) => { e.preventDefault(); createDeck.mutate(); }}
            className="bg-ink-50 border border-white/10 p-6 mb-8 grid sm:grid-cols-[1fr_2fr_auto] gap-4 items-end"
            data-testid="new-deck-form"
          >
            <div>
              <Label htmlFor="dn">Name</Label>
              <Input id="dn" value={name} onChange={(e) => setName(e.target.value)} required data-testid="new-deck-name" />
            </div>
            <div>
              <Label htmlFor="dd">Description</Label>
              <Input id="dd" value={desc} onChange={(e) => setDesc(e.target.value)} data-testid="new-deck-description" />
            </div>
            <Button type="submit" disabled={createDeck.isPending || !name} data-testid="new-deck-submit">
              {createDeck.isPending ? '…' : 'Create'}
            </Button>
          </form>
        )}

        {decks.length === 0 ? (
          <p className="font-sans text-bone-200" data-testid="empty-decks">No decks in this course yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10" data-testid="deck-grid">
            {decks.map((d) => (
              <Link
                key={d.id}
                href={`/decks/${d.id}`}
                className="bg-ink-50 p-8 hover:bg-ink-100 transition-colors group"
                data-testid={`deck-${d.id}`}
              >
                <p className="meta mb-2">Deck</p>
                <h3 className="font-display text-2xl font-bold tracking-tight mb-3 group-hover:text-bone-200 transition-colors">
                  {d.name}
                </h3>
                <p className="font-sans text-sm text-bone-200 line-clamp-2 mb-6">
                  {d.description || '—'}
                </p>
                <span className="meta">Open deck →</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
