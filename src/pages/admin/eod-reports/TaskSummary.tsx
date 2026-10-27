import type { IEodSubmission, IEodWorkEntry } from '@/types/eod-submission';

const TASK_DOT: Record<IEodWorkEntry['status'], string> = {
  completed: 'bg-status-success',
  in_progress: 'bg-status-info',
  pending: 'bg-status-warning',
};

const STATUS_LABEL: Record<IEodWorkEntry['status'], string> = {
  completed: 'Completed',
  in_progress: 'In progress',
  pending: 'Pending',
};

const taskLabel = (e: IEodWorkEntry) =>
  `${e.task}${e.quantity ? ` ×${e.quantity}` : ''}`;

/** The first two tasks, each with a status dot, and how many more there are. */
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

  const shown = entries.slice(0, 2);
  const more = entries.length - shown.length;
  return (
    <ul
      className="space-y-1"
      title={entries
        .map(e => `${taskLabel(e)} · ${STATUS_LABEL[e.status]}`)
        .join('\n')}
    >
      {shown.map((e, i) => (
        <li key={i} className="flex min-w-0 items-center gap-2 text-sm">
          <span
            className={`size-1.5 shrink-0 rounded-full ${TASK_DOT[e.status]}`}
            aria-label={STATUS_LABEL[e.status]}
          />
          <span className="truncate">{e.task}</span>
          {e.quantity ? (
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              ×{e.quantity}
            </span>
          ) : null}
          {i === shown.length - 1 && more > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              +{more} more
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
