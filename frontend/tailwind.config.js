/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          0: '#050505',
          50: '#0A0A0A',
          100: '#121212',
        },
        bone: {
          50: '#F4F4F5',
          200: '#A1A1AA',
          500: '#52525B',
        },
        anki: {
          again: '#FF3B30',
          hard:  '#FF9500',
          good:  '#34C759',
          easy:  '#007AFF',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans:    ['var(--font-body)',    'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)',    'ui-monospace', 'monospace'],
      },
      letterSpacing: { 'meta': '0.2em' },
      borderRadius: { DEFAULT: '0px', sm: '2px' },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
