'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Course } from '@/lib/types';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'mine'],
    queryFn: async () => (await api.get<Course[]>('/courses/mine')).data,
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [creating, setCreating] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/courses', { title, description, category, published: true });
      setTitle('');
      setDescription('');
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ['courses', 'mine'] });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="meta mb-4">01 / Teacher dashboard</p>
      <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
        <h1 className="font-display text-5xl font-bold tracking-tight" data-testid="dashboard-title">
          Your studio, {user?.name.split(' ')[0]}.
        </h1>
        <Button onClick={() => setOpen((v) => !v)} data-testid="new-course-btn">
          {open ? 'Cancel' : '+ New course'}
        </Button>
      </div>

      {open && (
        <form
          onSubmit={create}
          className="bg-ink-50 border border-white/10 p-8 mb-12 grid sm:grid-cols-2 gap-4"
          data-testid="new-course-form"
        >
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-testid="new-course-title"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="new-course-category"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="new-course-description"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={creating} data-testid="new-course-submit">
              {creating ? 'Creating…' : 'Create course'}
            </Button>
          </div>
        </form>
      )}

      {courses.length === 0 ? (
        <p className="font-sans text-bone-200" data-testid="empty-teacher-courses">
          No courses yet. Spin one up above ↑
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10" data-testid="teacher-course-grid">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className="bg-ink-50 p-8 hover:bg-ink-100 transition-colors group"
              data-testid={`teacher-course-${c.id}`}
            >
              <p className="meta mb-2">{c.category}</p>
              <h3 className="font-display text-2xl font-bold tracking-tight mb-4 group-hover:text-bone-200 transition-colors">
                {c.title}
              </h3>
              <p className="font-sans text-sm text-bone-200 line-clamp-2 mb-6">
                {c.description || '—'}
              </p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-bone-500">
                  CODE · <span className="text-bone-50">{c.inviteCode}</span>
                </p>
                <span className="meta">Open →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
