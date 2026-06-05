'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@learndeck.app');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Marketing side */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 bg-ink-50 border-r border-white/8">
        <Link href="/" className="font-display text-2xl font-bold" data-testid="auth-brand">
          LEARN<span className="text-bone-500">/</span>DECK
        </Link>
        <div>
          <p className="meta mb-6">01 / Welcome back</p>
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight max-w-md">
            Pick up exactly where you left off.
          </h2>
          <p className="mt-4 font-sans text-bone-200 max-w-md">
            Your SM-2 schedule has been waiting for you.
          </p>
        </div>
        <p className="meta">02 / Sign in</p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold tracking-tight mb-2" data-testid="login-title">
            Sign in
          </h1>
          <p className="font-sans text-bone-200 mb-10">
            No account?{' '}
            <Link href="/register" className="text-bone-50 underline underline-offset-4" data-testid="register-link">
              Create one.
            </Link>
          </p>

          <form onSubmit={onSubmit} className="space-y-5" data-testid="login-form">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password"
              />
            </div>
            {error && (
              <p className="font-mono text-xs text-anki-again" data-testid="login-error">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
              data-testid="login-submit"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
