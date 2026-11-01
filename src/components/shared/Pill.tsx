import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Colour is carried by the text and a faint border only, never a coloured
 * fill, so a glance at a table tells the states apart.
 */
const TONES = {
  neutral: 'text-text-secondary border-white/[0.08]',
  muted: 'text-text-tertiary border-white/[0.08]',
  strong: 'text-foreground border-white/[0.16]',
  success: 'text-status-success border-status-success/20',
  warning: 'text-status-warning border-status-warning/20',
  error: 'text-status-error border-status-error/20',
  info: 'text-status-info border-status-info/20',
} as const;

export type PillTone = keyof typeof TONES;

/** A small status label. */
export function Pill({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: PillTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
