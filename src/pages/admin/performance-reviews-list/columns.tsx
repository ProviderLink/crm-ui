import type { ColumnDef } from '@tanstack/react-table';
import { DownloadIcon, EyeIcon, Loader2Icon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type {
  IPerformanceReview,
  ReviewStatus,
} from '@/types/performance-review';

import { RatingDisplay, StatusBadge } from './badges';

export function buildReviewColumns({
  vaMap,
  clientMap,
  exportingId,
  onView,
  onExport,
  onDelete,
}: {
  vaMap: Record<string, string>;
  clientMap: Record<string, string>;
  exportingId: string | null;
  onView: (review: IPerformanceReview) => void;
  onExport: (review: IPerformanceReview) => void;
  onDelete: (review: IPerformanceReview) => void;
}): ColumnDef<IPerformanceReview>[] {
  return [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      size: 90,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'vaName',
      header: 'VA',
      meta: { fill: true },
      cell: ({ row }) => (
        <span className="text-sm font-medium truncate block min-w-0">
          {row.original.candidateName ?? vaMap[row.original.vaId] ?? '—'}
        </span>
      ),
    },
    {
      id: 'client',
      header: 'Client',
      meta: { fill: true },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate block min-w-0">
          {row.original.clientName ?? clientMap[row.original.clientId] ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'reviewType',
      header: 'Type',
      size: 110,
      cell: ({ getValue }) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'overallRating',
      header: 'Rating',
      size: 160,
      cell: ({ getValue }) => (
        <RatingDisplay rating={getValue<number | null>()} />
      ),
    },
    {
      accessorKey: 'reviewStatus',
      header: 'Status',
      size: 125,
      cell: ({ getValue }) => <StatusBadge status={getValue<ReviewStatus>()} />,
    },
    {
      accessorKey: 'finalRecommendation',
      header: 'Recommendation',
      size: 190,
      cell: ({ getValue }) => {
        const val = getValue<string>();
        return val ? (
          <span className="text-xs text-muted-foreground block truncate">
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
        const isCompleted = r.reviewStatus === 'Completed';
        return (
          <div className="flex items-center gap-1 justify-end">
            <Button
              size="icon" aria-label={isCompleted ? 'View review (read-only)' : 'Edit review'}
              variant="ghost"
              className={`size-7 ${isCompleted ? 'text-muted-foreground' : ''}`}
              title={
                isCompleted ? 'View (read-only)' : 'Edit'
              }
              onClick={() => onView(r)}
            >
              <EyeIcon className="size-3.5" />
            </Button>
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
