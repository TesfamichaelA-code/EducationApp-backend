'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth-context';

/** Client-side guard — redirects to /login if the auth query resolves to null. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="meta" data-testid="auth-guard-loading">Authenticating…</p>
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}
