import { formatDateKeyShort } from '@/lib/time';
import type { IEodSubmission } from '@/types/eod-submission';

import { initials } from './helpers';

/** One recent daily report; opens its full detail when clicked. */
export function RecentEodItem({
  eod,
  displayName,
  onOpen,
}: {
  eod: IEodSubmission;
  displayName: string;
  onOpen: () => void;
}) {
  const tasks =
    eod.workEntries && eod.workEntries.length > 0
      ? eod.workEntries
          .map(e => `${e.task}${e.quantity ? ` ×${e.quantity}` : ''}`)
          .join(' · ')
      : eod.summaryOfWork || '—';
  return (
    <li className="py-1 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={onOpen}
        className="-mx-3 flex w-[calc(100%+1.5rem)] items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
          {initials(displayName) || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-medium">{displayName}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {formatDateKeyShort(eod.date)} · {eod.hoursWorked}h
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {tasks}
          </p>
          {eod.blockers?.trim() && (
            <p className="mt-0.5 text-xs text-status-warning">
              Blocker reported
            </p>
          )}
        </div>
      </button>
    </li>
  );
}
