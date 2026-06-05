'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { AuthUser, Role } from '@/lib/auth-context';
import type { Course } from '@/lib/types';

export default function AdminDashboard() {
  const qc = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<AuthUser[]>('/users')).data,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: async () => (await api.get<Course[]>('/courses')).data,
  });

  async function changeRole(id: string, role: Role) {
    await api.patch(`/users/${id}/role`, { role });
    void qc.invalidateQueries({ queryKey: ['users'] });
  }

  async function toggleActive(id: string, isActive: boolean) {
    await api.patch(`/users/${id}/active`, { isActive });
    void qc.invalidateQueries({ queryKey: ['users'] });
  }

  const byRole = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    },
    {} as Record<Role, number>,
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="meta mb-4">01 / Admin console</p>
      <h1 className="font-display text-5xl font-bold tracking-tight mb-12" data-testid="dashboard-title">
        Platform overview.
      </h1>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 mb-16" data-testid="admin-stats">
        <Tile label="Total users" value={users.length} />
        <Tile label="Students" value={byRole.student ?? 0} />
        <Tile label="Teachers" value={byRole.teacher ?? 0} />
        <Tile label="Courses" value={courses.length} />
      </section>

      <section data-testid="admin-users-table">
        <p className="meta mb-4">02 / Users</p>
        <div className="border border-white/10">
          <div className="grid grid-cols-[2fr_1.2fr_0.8fr_1fr_1fr] gap-4 px-4 py-3 border-b border-white/10 meta">
            <span>Email</span>
            <span>Name</span>
            <span>Role</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {users.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[2fr_1.2fr_0.8fr_1fr_1fr] gap-4 px-4 py-4 border-b border-white/5 items-center text-sm"
              data-testid={`admin-user-${u.id}`}
            >
              <span className="font-mono truncate">{u.email}</span>
              <span className="text-bone-200">{u.name}</span>
              <span className="meta">{u.role}</span>
              <span className={u.isActive ? 'text-anki-good' : 'text-anki-again'}>
                {u.isActive ? 'active' : 'disabled'}
              </span>
              <div className="flex gap-2">
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value as Role)}
                  className="bg-ink-100 border border-white/10 px-2 py-1 font-mono text-xs"
                  data-testid={`admin-role-${u.id}`}
                >
                  <option value="student">student</option>
                  <option value="teacher">teacher</option>
                  <option value="admin">admin</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive(u.id, !u.isActive)}
                  data-testid={`admin-toggle-${u.id}`}
                >
                  {u.isActive ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <p className="meta mb-4">03 / Courses</p>
        <ul className="border border-white/10 divide-y divide-white/8">
          {courses.map((c) => (
            <li key={c.id}>
              <Link
                href={`/courses/${c.id}`}
                className="block px-6 py-4 hover:bg-ink-50 transition-colors"
                data-testid={`admin-course-${c.id}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="meta mb-1">{c.category}</p>
                    <p className="font-display text-lg font-medium">{c.title}</p>
                  </div>
                  <p className="font-mono text-xs text-bone-500">{c.inviteCode}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ink-50 p-6">
      <p className="meta mb-3">{label}</p>
      <p className="font-display text-4xl font-bold tracking-tight" data-testid={`tile-${label.toLowerCase().replace(/\s/g, '-')}`}>
        {value}
      </p>
    </div>
  );
}
