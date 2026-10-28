import type { IEodSubmission, IEodWorkEntry } from '@/types/eod-submission';

const STATUS_LABEL: Record<IEodWorkEntry['status'], string> = {
  completed: 'Completed',
  in_progress: 'In progress',
  pending: 'Pending',
};

const taskLabel = (e: IEodWorkEntry) =>
  `${e.task}${e.quantity ? ` ×${e.quantity}` : ''}`;

/**
 * Two lines, like the other columns: the tasks on one line, then how many are
 * done (and whether the VA reported a blocker) in muted text underneath.
 */
export function TaskSummary({ eod }: { eod: IEodSubmission }) {
  const entries = eod.workEntries ?? [];

  // Older reports only have free text.
  if (entries.length === 0) {
    return (
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {eod.summaryOfWork || '—'}
      </p>
    );
  }

  const done = entries.filter(e => e.status === 'completed').length;
  const hasBlockers = !!eod.blockers?.trim();
  return (
    <div
      className="min-w-0"
      title={entries
        .map(e => `${taskLabel(e)} · ${STATUS_LABEL[e.status]}`)
        .join('\n')}
    >
      <p className="text-sm leading-snug">
        {entries.map(taskLabel).join(' · ')}
      </p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {done} of {entries.length} completed
        </span>
        {hasBlockers && (
          <>
            <span aria-hidden>·</span>
            <span className="text-status-warning">Blocker reported</span>
          </>
        )}
      </p>
    </div>
  );
}
