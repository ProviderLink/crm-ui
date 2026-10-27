import type { ColumnDef } from '@tanstack/react-table';
import { Fragment } from 'react';
import { DownloadIcon, Loader2Icon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { IPerformanceReview } from '@/types/performance-review';

import { RatingDisplay, StatusBadge } from './badges';

export function buildReviewColumns({
  vaMap,
  clientMap,
  exportingId,
  onExport,
  onDelete,
}: {
  vaMap: Record<string, string>;
  clientMap: Record<string, string>;
  exportingId: string | null;
  onExport: (review: IPerformanceReview) => void;
  onDelete: (review: IPerformanceReview) => void;
}): ColumnDef<IPerformanceReview>[] {
  return [
    {
      id: 'vaName',
      header: 'VA',
      meta: { fill: true, cellClassName: 'max-w-0' },
      accessorFn: r => r.candidateName ?? vaMap[r.vaId] ?? '',
      cell: ({ row }) => {
        const r = row.original;
        const name = r.candidateName ?? vaMap[r.vaId] ?? '—';
        const client = r.clientName ?? clientMap[r.clientId] ?? '—';
        const initials = name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] font-mono text-xs text-text-secondary">
              {initials || '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={name}>
                {name}
              </p>
              <p
                className="truncate text-xs text-muted-foreground"
                title={client}
              >
                {client}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'reviewType',
      header: 'Type',
      // Never narrower than "Corrective" plus padding, so a short type such as
      // "30-Day" is not squeezed into breaking at its hyphen.
      size: 112,
      cell: ({ row }) => (
        <div>
          {/* Each word is unbreakable; long types wrap only between words. */}
          <p className="text-sm leading-snug">
            {row.original.reviewType.split(' ').map((word, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className="whitespace-nowrap">{word}</span>
              </Fragment>
            ))}
          </p>
          {/* Narrow screens: the date folds under the type. */}
          <p className="mt-0.5 text-xs whitespace-nowrap text-muted-foreground @min-[960px]/main:hidden">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      meta: {
        thClassName: 'hidden @min-[960px]/main:table-cell',
        cellClassName: 'hidden @min-[960px]/main:table-cell',
      },
      cell: ({ getValue }) => (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'overallRating',
      header: 'Rating',
      // Fixed width (the stars plus score), so the column does not collapse
      // when no row on the page has a rating yet.
      size: 120,
      cell: ({ getValue }) => (
        <RatingDisplay rating={getValue<number | null>()} />
      ),
    },
    {
      accessorKey: 'reviewStatus',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={row.original.reviewStatus} />
          {/* Narrow screens: the recommendation folds under the status. */}
          {row.original.finalRecommendation && (
            <p className="max-w-[9rem] text-xs leading-snug text-muted-foreground @min-[960px]/main:hidden">
              {row.original.finalRecommendation}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'finalRecommendation',
      header: 'Recommendation',
      meta: {
        thClassName: 'hidden @min-[960px]/main:table-cell',
        cellClassName: 'hidden @min-[960px]/main:table-cell',
      },
      cell: ({ getValue }) => {
        const val = getValue<string | null>();
        return val ? (
          <span className="block max-w-[9.5rem] text-sm leading-snug text-muted-foreground">
            {val}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { shrink: true },
      cell: ({ row }) => {
        const r = row.original;
        const isExporting = exportingId === r.id;
        return (
          <div
            className="flex items-center gap-0.5 justify-end"
            onClick={e => e.stopPropagation()}
          >
            <Button
              size="icon" aria-label="Export review as PDF"
              variant="ghost"
              className="size-7"
              title="Export PDF"
              disabled={isExporting}
              onClick={() => onExport(r)}
            >
              {isExporting ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <DownloadIcon className="size-3.5" />
              )}
            </Button>
              <Button
                size="icon" aria-label="Delete review"
                variant="ghost"
                className="size-7 text-destructive/60 hover:text-destructive"
                title="Delete"
                onClick={() => onDelete(r)}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
          </div>
        );
      },
    },
  ];
}
