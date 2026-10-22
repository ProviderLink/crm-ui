import { LockIcon, StarIcon } from 'lucide-react';

import { RATING_LABELS, type ReviewStatus } from '@/types/performance-review';

const STATUS_STYLES: Record<ReviewStatus, string> = {
  Draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  'AI Generated': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'In Review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Sent to Client': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Archived: 'bg-zinc-500/8 text-zinc-500 border-zinc-500/15',
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLES[status] ?? STATUS_STYLES['Draft']}`}
    >
      {status === 'Completed' && (
        <LockIcon className="size-2.5 mr-1 opacity-70" />
      )}
      {status}
    </span>
  );
}

export function RatingDisplay({ rating }: { rating: number | null }) {
  if (rating == null)
    return <span className="text-xs text-muted-foreground/50">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="inline-flex items-center gap-0.5 font-semibold text-sm tabular-nums">
        <StarIcon className="size-3 text-amber-400 fill-amber-400" />
        {rating}
      </span>
      <span className="text-[11px] text-muted-foreground leading-none">
        {RATING_LABELS[rating]}
      </span>
    </span>
  );
}
