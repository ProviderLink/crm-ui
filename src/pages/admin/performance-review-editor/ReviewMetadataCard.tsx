import type { IPerformanceReview } from '@/types/performance-review';

const fmt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

export function ReviewMetadataCard({ review }: { review: IPerformanceReview }) {
  const items = [
    { label: 'VA', value: review.candidateName ?? '—' },
    { label: 'Client', value: review.clientName ?? '—' },
    {
      label: 'Review period',
      value: `${fmt(review.reviewPeriodStart)} – ${fmt(review.reviewPeriodEnd)}`,
    },
  ];
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 sm:grid-cols-[1fr_1fr_auto]">
      {items.map(i => (
        <div key={i.label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{i.label}</dt>
          <dd className="mt-0.5 text-sm font-medium break-words">
            {i.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
