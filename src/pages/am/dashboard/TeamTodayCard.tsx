import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateKeyShort } from '@/lib/time';

import { Pill } from '../../admin/accounts/badges';
import { initialsOf } from '../../admin/work-entries/format';
import type { TeamRow } from './use-am-dashboard';

/** Each VA the manager looks after, and whether today's report is in. */
export function TeamTodayCard({
  rows,
  loading,
}: {
  rows: TeamRow[];
  loading: boolean;
}) {
  return (
    <Card className="gap-4 p-5">
      <CardHeader className="flex-row items-baseline justify-between gap-3 space-y-0 p-0">
        <CardTitle className="text-sm font-medium">My VAs today</CardTitle>
        {!loading && rows.length > 0 && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {rows.length} {rows.length === 1 ? 'assignment' : 'assignments'}
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0 pt-1">
        {loading ? (
          <Skeleton className="h-32 w-full rounded-md" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have no active assignments yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map(r => (
              <li
                key={r.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
                  {initialsOf(r.vaName) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.vaName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[r.clientName, r.service].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="hidden w-24 text-right sm:block">
                  <p className="text-sm tabular-nums">
                    {r.weekHours.toFixed(1)}h
                  </p>
                  <p className="text-xs text-muted-foreground">this week</p>
                </div>
                <div className="hidden w-24 text-right md:block">
                  <p className="text-sm">
                    {r.lastReport ? formatDateKeyShort(r.lastReport) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">last report</p>
                </div>
                <div className="flex w-24 justify-end">
                  {r.onHold ? (
                    <Pill>On hold</Pill>
                  ) : r.submittedToday ? (
                    <Pill tone="success">Submitted</Pill>
                  ) : (
                    <Pill tone="warning">Missing</Pill>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
