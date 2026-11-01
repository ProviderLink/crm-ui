import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardStatCard({
  label,
  value,
  icon: Icon,
  valueClassName = '',
  isLoading,
  to,
  children,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  /** e.g. a red number when something needs attention. */
  valueClassName?: string;
  isLoading: boolean;
  /** Where the card leads when clicked. */
  to?: string;
  /** One supporting line under the number. */
  children?: ReactNode;
}) {
  const card = (
    <Card
      className={`gap-0 p-5 ${to ? 'transition-colors hover:border-white/[0.2]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-3">
        {isLoading ? (
          <Skeleton className="h-9 w-16 rounded-md" />
        ) : (
          <p
            className={`text-3xl font-semibold tracking-tight tabular-nums ${valueClassName}`}
          >
            {value}
          </p>
        )}
      </div>
      <div className="mt-1.5 min-h-5 text-xs text-muted-foreground">
        {isLoading ? <Skeleton className="h-3.5 w-32 rounded" /> : children}
      </div>
    </Card>
  );
  return to ? (
    <Link
      to={to}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {card}
    </Link>
  ) : (
    card
  );
}
