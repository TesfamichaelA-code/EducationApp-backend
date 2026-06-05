'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card — flat surface with a 1px subtle border. No rounding, no shadow.
 * Matches the Swiss brutalist aesthetic.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('bg-ink-100 border border-white/10', className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pb-3', className)} {...props} />
);
const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pt-3', className)} {...props} />
);
const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 pb-6 pt-3 border-t border-white/5', className)} {...props} />
);

export { Card, CardHeader, CardContent, CardFooter };
