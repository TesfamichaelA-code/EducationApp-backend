import Image from 'next/image';
import Link from 'next/link';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <>
      <Header variant="marketing" />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen overflow-hidden pt-16">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.pexels.com/photos/4258834/pexels-photo-4258834.jpeg"
            alt=""
            fill
            priority
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-0/40 via-ink-0/70 to-ink-0" />
        </div>

        <div className="mx-auto max-w-7xl px-6 pt-32 pb-24">
          <p className="meta mb-8" data-testid="hero-meta">
            01 / Focus-mode learning
          </p>

          <h1 className="font-display text-6xl sm:text-7xl lg:text-[8.5rem] font-extrabold leading-[0.95] tracking-tighter max-w-5xl">
            Study like
            <br />
            it&apos;s the only
            <br />
            <span className="text-bone-500">thing that matters.</span>
          </h1>

          <div className="mt-12 grid gap-12 lg:grid-cols-[2fr_1fr] items-end">
            <p className="font-sans text-lg sm:text-xl text-bone-200 leading-relaxed max-w-2xl">
              LearnDeck merges Google Classroom course management with AnkiDroid&apos;s
              spaced-repetition science. AI-generated flashcards from any text. A
              cinematic study mode you actually want to open at 11pm.
            </p>
            <div className="flex gap-3" data-testid="hero-ctas">
              <Button asChild size="lg" data-testid="hero-register">
                <Link href="/register">Start learning</Link>
              </Button>
              <Button asChild size="lg" variant="outline" data-testid="hero-login">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO STATS ──────────────────────────────────────────────────── */}
      <section className="border-t border-white/8 py-32">
        <div className="mx-auto max-w-7xl px-6">
          <p className="meta mb-12">02 / What you get</p>

          <div className="grid grid-cols-1 lg:grid-cols-6 gap-px bg-white/10">
            <Feature
              span="lg:col-span-4 lg:row-span-2"
              kicker="Headliner"
              title="A study mode that disappears the rest of the world."
              copy="Full-screen, pure black, 3D card flip. Keyboard-driven rating in 1-4. SM-2 spaced repetition under the hood — built from the original Wozniak paper, not a wrapper."
            />
            <Feature
              span="lg:col-span-2"
              kicker="AI"
              title="Flashcards from any text."
              copy="Paste a paragraph. Gemini drafts conceptual Q/A pairs. Save the good ones to a deck in one click."
            />
            <Feature
              span="lg:col-span-2"
              kicker="Classroom"
              title="Invite-code enrollment, role-based dashboards, PDF resources."
              copy=""
            />
            <Feature
              span="lg:col-span-3"
              kicker="Notes"
              title="Split-screen markdown notes."
              copy="Tiptap on the left, your PDF or live preview on the right. Distraction-free toolbar."
            />
            <Feature
              span="lg:col-span-3"
              kicker="Built right"
              title="NestJS 11 · Mongoose 8 · 50 endpoints · 12-round bcrypt · refresh-token rotation · GridFS · JWT cookies."
              copy=""
            />
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <p className="font-display text-3xl font-bold">
            LEARN<span className="text-bone-500">/</span>DECK
          </p>
          <p className="meta">Built for serious students · 2026</p>
        </div>
      </footer>
    </>
  );
}

function Feature({
  span,
  kicker,
  title,
  copy,
}: {
  span: string;
  kicker: string;
  title: string;
  copy: string;
}) {
  return (
    <div className={`${span} bg-ink-50 p-8 sm:p-10`}>
      <p className="meta mb-4">{kicker}</p>
      <h3 className="font-display text-2xl sm:text-3xl font-bold leading-tight tracking-tight mb-3">
        {title}
      </h3>
      {copy && <p className="font-sans text-bone-200 leading-relaxed">{copy}</p>}
    </div>
  );
}
