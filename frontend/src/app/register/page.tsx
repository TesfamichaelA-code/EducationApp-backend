'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, name, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden lg:flex flex-col justify-between p-12 bg-ink-50 border-r border-white/8">
        <Link href="/" className="font-display text-2xl font-bold" data-testid="auth-brand">
          LEARN<span className="text-bone-500">/</span>DECK
        </Link>
        <div>
          <p className="meta mb-6">01 / Get started</p>
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight max-w-md">
            Build your study deck in under two minutes.
          </h2>
        </div>
        <p className="meta">02 / Register</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold tracking-tight mb-2" data-testid="register-title">
            Create account
          </h1>
          <p className="font-sans text-bone-200 mb-10">
            Already here?{' '}
            <Link href="/login" className="text-bone-50 underline underline-offset-4" data-testid="login-link">
              Sign in.
            </Link>
          </p>

          <form onSubmit={onSubmit} className="space-y-5" data-testid="register-form">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="register-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="register-email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password (min 8)</Label>
              <Input
                id="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="register-password"
              />
            </div>
            {error && (
              <p className="font-mono text-xs text-anki-again" data-testid="register-error">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
              data-testid="register-submit"
            >
              {submitting ? 'Creating…' : 'Create account'}
            </Button>
            <p className="text-xs text-bone-500 leading-relaxed">
              By creating an account you agree to be tracked exclusively by your own SM-2 schedule.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
