'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth-context';

/** Bounces the user to their role-specific dashboard. */
export default function DashboardRouter() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    router.replace(`/dashboard/${user.role}`);
  }, [user, loading, router]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="meta" data-testid="dashboard-routing">Routing to your dashboard…</p>
    </div>
  );
}
