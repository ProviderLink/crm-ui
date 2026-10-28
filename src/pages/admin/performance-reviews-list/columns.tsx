import type { ColumnDef } from '@tanstack/react-table';
import {
  DownloadIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  Trash2Icon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { IPerformanceReview } from '@/types/performance-review';

import { RatingDisplay, StatusBadge } from './badges';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
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
      header: 'Review',
      size: 150,
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="text-sm">{row.original.reviewType}</p>
          <p className="text-xs text-muted-foreground">
            {fmt(row.original.createdAt)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'reviewStatus',
      header: 'Status',
      size: 130,
      cell: ({ row }) => <StatusBadge status={row.original.reviewStatus} />,
    },
    {
      accessorKey: 'overallRating',
      header: 'Rating',
      size: 100,
      cell: ({ getValue }) => (
        <RatingDisplay rating={getValue<number | null>()} />
      ),
    },
    {
      accessorKey: 'finalRecommendation',
      header: 'Recommendation',
      size: 190,
      meta: {
        thClassName: 'hidden @min-[1000px]/main:table-cell',
        cellClassName: 'hidden @min-[1000px]/main:table-cell',
      },
      cell: ({ getValue }) => {
        const val = getValue<string | null>();
        return val ? (
          <span className="text-sm text-muted-foreground">{val}</span>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      meta: { shrink: true },
      cell: ({ row }) => {
        const r = row.original;
        const isExporting = exportingId === r.id;
        return (
          <div className="flex justify-end" onClick={e => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-muted-foreground"
                  aria-label="Review actions"
                >
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={isExporting}
                  onSelect={() => onExport(r)}
                >
                  {isExporting ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <DownloadIcon className="size-4" />
                  )}
                  Export PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => onDelete(r)}
                >
                  <Trash2Icon className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
