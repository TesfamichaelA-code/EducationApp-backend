'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Button — sharp, brutalist, no shadows, no rounding. Anki variants colored
 * exactly to the design guidelines for the SM-2 rating row.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center font-mono text-[11px] uppercase tracking-meta font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        default: 'bg-bone-50 text-ink-0 hover:bg-bone-200',
        outline:
          'border border-white/15 bg-transparent text-bone-50 hover:bg-bone-50 hover:text-ink-0',
        ghost: 'text-bone-200 hover:text-bone-50',
        danger: 'bg-anki-again/90 text-white hover:bg-anki-again',
        anki_again: 'bg-anki-again text-white hover:opacity-90',
        anki_hard: 'bg-anki-hard text-white hover:opacity-90',
        anki_good: 'bg-anki-good text-white hover:opacity-90',
        anki_easy: 'bg-anki-easy text-white hover:opacity-90',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 px-3 text-[10px]',
        lg: 'h-12 px-7',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
