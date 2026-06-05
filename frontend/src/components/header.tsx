'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

/**
 * Crystal-glass header — fixed, frosted background, always-visible nav.
 *
 * Hides itself on the marketing landing page (where the page does its own
 * full-bleed hero) but appears on every authenticated route.
 */
export function Header({ variant = 'app' }: { variant?: 'app' | 'marketing' }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // On marketing pages, optionally bounce signed-in users to their dashboard.
  useEffect(() => {
    if (variant === 'marketing' && user && pathname === '/') {
      // soft prompt rather than hard redirect — the user might be browsing
    }
  }, [variant, user, pathname]);

  return (
    <header className="glass fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href={user ? '/dashboard' : '/'}
          className="font-display text-xl font-bold tracking-tight text-bone-50 hover:text-bone-200 transition-colors"
          data-testid="brand-link"
        >
          LEARN<span className="text-bone-500">/</span>DECK
        </Link>

        <nav className="flex items-center gap-6">
          {!loading && !user && (
            <>
              <Link
                href="/login"
                className="meta hover:text-bone-50 transition-colors"
                data-testid="nav-login"
              >
                Sign in
              </Link>
              <Button asChild size="sm" data-testid="nav-register">
                <Link href="/register">Create account</Link>
              </Button>
            </>
          )}
          {!loading && user && (
            <>
              <span className="meta" data-testid="nav-user-email">
                {user.email}
              </span>
              <span className="meta px-2 py-0.5 border border-white/15" data-testid="nav-user-role">
                {user.role}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void logout()}
                data-testid="nav-logout"
              >
                Sign out
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
