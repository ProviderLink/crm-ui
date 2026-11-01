import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** A boxed figure with a label: a count, a total, a score. */
export function StatTile({
  label,
  value,
  sub,
  size = 'sm',
  alert = false,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  /** A line under the value, such as a name. */
  sub?: string;
  size?: 'sm' | 'md';
  /** Draws the value in the warning colour. */
  alert?: boolean;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-white/[0.1] bg-white/[0.03]',
        size === 'md' ? 'px-4 py-3' : 'px-3 py-2.5'
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-semibold tabular-nums',
          size === 'md' ? 'text-xl' : 'text-base',
          alert && 'text-status-warning',
          valueClassName
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
