'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Course, StudyStats } from '@/lib/types';

export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: courses = [] } = useQuery({
    queryKey: ['enrollments', 'mine'],
    queryFn: async () => (await api.get<Course[]>('/enrollments/mine')).data,
  });

  const { data: stats } = useQuery({
    queryKey: ['study', 'stats'],
    queryFn: async () => (await api.get<StudyStats>('/study/stats')).data,
  });

  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);
    setJoining(true);
    try {
      const { data } = await api.post('/enrollments/join', { inviteCode: code });
      setCode('');
      router.push(`/courses/${data.course.id}`);
    } catch (err: any) {
      setJoinError(err?.response?.data?.message ?? 'Could not join');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="meta mb-4">01 / Student dashboard</p>
      <h1 className="font-display text-5xl font-bold tracking-tight mb-12" data-testid="dashboard-title">
        Welcome back, {user?.name.split(' ')[0]}.
      </h1>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 mb-16" data-testid="stats-row">
        <Stat label="Cards reviewed" value={stats?.totalReviewed ?? 0} />
        <Stat label="Due now" value={stats?.dueNow ?? 0} accent />
        <Stat label="Learning" value={stats?.learning ?? 0} />
        <Stat label="Mature" value={stats?.mature ?? 0} />
      </section>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-px bg-white/10">
        {/* Course list */}
        <section className="bg-ink-50 p-8 sm:p-10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="meta mb-2">02 / My courses</p>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                {courses.length} enrolled
              </h2>
            </div>
          </div>

          {courses.length === 0 ? (
            <p className="font-sans text-bone-200" data-testid="empty-courses">
              You haven&apos;t joined a course yet. Use an invite code →
            </p>
          ) : (
            <ul className="divide-y divide-white/8" data-testid="course-list">
              {courses.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/courses/${c.id}`}
                    className="flex items-center justify-between py-5 group"
                    data-testid={`course-${c.id}`}
                  >
                    <div>
                      <p className="meta mb-1">{c.category}</p>
                      <p className="font-display text-xl font-medium group-hover:text-bone-200 transition-colors">
                        {c.title}
                      </p>
                    </div>
                    <span className="meta">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Join by code */}
        <aside className="bg-ink-50 p-8 sm:p-10">
          <p className="meta mb-2">03 / Join</p>
          <h2 className="font-display text-2xl font-bold tracking-tight mb-6">
            Got an invite code?
          </h2>
          <form onSubmit={handleJoin} data-testid="join-form" className="space-y-4">
            <div>
              <Label htmlFor="code">Invite code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="A4F2KL12"
                className="uppercase tracking-widest"
                data-testid="join-code-input"
              />
            </div>
            {joinError && (
              <p className="font-mono text-xs text-anki-again" data-testid="join-error">
                {joinError}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={joining || code.length < 4}
              data-testid="join-submit"
            >
              {joining ? 'Joining…' : 'Join course'}
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-ink-50 p-6">
      <p className="meta mb-3">{label}</p>
      <p
        className={`font-display text-4xl font-bold tracking-tight ${accent ? 'text-anki-good' : ''}`}
        data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}
      >
        {value}
      </p>
    </div>
  );
}
