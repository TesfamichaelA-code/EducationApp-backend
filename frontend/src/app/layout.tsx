import type { Metadata } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';

import { Providers } from '@/lib/providers';
import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-display',
  display: 'swap',
});

const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LearnDeck — Cinematic Study Platform',
  description:
    'A focus-mode learning platform combining Google Classroom course management with AnkiDroid-style spaced repetition. Powered by Gemini AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-ink-0 text-bone-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
