import { StarIcon } from 'lucide-react';

import { RATING_LABELS, type ReviewStatus } from '@/types/performance-review';

// Same pill language as the rest of the CRM: status colour on the text and a
// faint border only, never a coloured fill (see lib/status-styles.ts).
const PILL = 'bg-white/[0.04]';

const STATUS_STYLES: Record<ReviewStatus, string> = {
  Draft: `${PILL} text-text-tertiary border-white/[0.08]`,
  'AI Generated': `${PILL} text-status-info border-status-info/20`,
  'In Review': `${PILL} text-status-warning border-status-warning/20`,
  Completed: `${PILL} text-status-success border-status-success/20`,
  'Sent to Client': `${PILL} text-foreground border-white/[0.16]`,
  Archived: `${PILL} text-text-tertiary border-white/[0.08]`,
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${STATUS_STYLES[status] ?? STATUS_STYLES['Draft']}`}
    >
      {status}
    </span>
  );
}

/** One star and the score out of five; the label is the tooltip. */
export function RatingDisplay({ rating }: { rating: number | null }) {
  if (rating == null)
    return <span className="text-xs text-muted-foreground/50">—</span>;
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm tabular-nums"
      title={`${rating} / 5 · ${RATING_LABELS[rating]}`}
    >
      <StarIcon className="size-3.5 fill-status-warning text-status-warning" />
      <span className="font-medium">{rating}</span>
      <span className="text-muted-foreground">/ 5</span>
    </span>
  );
}
