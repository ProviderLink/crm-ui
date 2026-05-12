import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  DownloadIcon,
  Loader2Icon,
  PenLineIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { GenerateReviewModal } from '@/components/performance-reviews/GenerateReviewModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  QK,
  useAtsClientsQuery,
  useAtsVAsQuery,
  usePerformanceReviewsQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import {
  deleteReview,
  exportReviewPdf,
  type IReviewFilters,
} from '@/services/performance-reviews.service';
import {
  RATING_LABELS,
  REVIEW_STATUSES,
  type IPerformanceReview,
  type ReviewStatus,
} from '@/types/performance-review';

const STATUS_STYLES: Record<ReviewStatus, string> = {
  Draft: 'bg-muted text-muted-foreground border-border',
  'AI Generated':
    'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400',
  'In Review':
    'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
  Completed:
    'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400',
  'Sent to Client':
    'bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-400',
  Archived: 'bg-muted/50 text-muted-foreground/70 border-border/50',
};

function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLES[status] ?? STATUS_STYLES['Draft']}`}
    >
      {status}
    </span>
  );
}

function RatingDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="flex items-center gap-1 text-sm tabular-nums">
      <StarIcon className="size-3 text-amber-500 fill-amber-500" />
      {rating}{' '}
      <span className="text-xs text-muted-foreground">
        {RATING_LABELS[rating]}
      </span>
    </span>
  );
}

export default function PerformanceReviewsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAppSelector(s => s.auth.user);
  const rolePrefix = user?.role === 'admin' ? '/admin' : '/am';

  const [generateOpen, setGenerateOpen] = useState(false);
  const [vaFilter, setVaFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IPerformanceReview | null>(
    null
  );

  const filters: IReviewFilters = {
    vaId: vaFilter !== 'all' ? vaFilter : undefined,
    clientId: clientFilter !== 'all' ? clientFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const { data: reviews = [], isLoading } = usePerformanceReviewsQuery(filters);
  const { data: vaList = [] } = useAtsVAsQuery();
  const { data: clientList = [] } = useAtsClientsQuery();

  const vaMap: Record<string, string> = {};
  for (const v of vaList) vaMap[v.id] = `${v.firstName} ${v.lastName}`;

  const clientMap: Record<string, string> = {};
  for (const c of clientList) clientMap[c.id] = c.companyName;

  async function handleExportPdf(review: IPerformanceReview) {
    setExportingId(review.id);
    try {
      const name = review.candidateName ?? vaMap[review.vaId] ?? 'review';
      await exportReviewPdf(
        review.id,
        `performance-review-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`
      );
    } catch {
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setExportingId(null);
    }
  }

  async function handleDelete(review: IPerformanceReview) {
    try {
      await deleteReview(review.id);
      queryClient.invalidateQueries({ queryKey: QK.performanceReviews() });
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review.');
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns: ColumnDef<IPerformanceReview>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      size: 95,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'vaName',
      header: 'VA Name',
      meta: { fill: true },
      cell: ({ row }) => (
        <span className="text-sm font-medium block truncate max-w-[180px]">
          {row.original.candidateName ?? vaMap[row.original.vaId] ?? '—'}
        </span>
      ),
    },
    {
      id: 'client',
      header: 'Client',
      size: 130,
      cell: ({ row }) => (
        <span className="text-sm block truncate max-w-[120px]">
          {row.original.clientName ?? clientMap[row.original.clientId] ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'reviewType',
      header: 'Type',
      size: 105,
      cell: ({ getValue }) => (
        <span className="text-xs whitespace-nowrap">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'overallRating',
      header: 'Rating',
      size: 80,
      cell: ({ getValue }) => (
        <RatingDisplay rating={getValue<number | null>()} />
      ),
    },
    {
      accessorKey: 'reviewStatus',
      header: 'Status',
      size: 120,
      cell: ({ getValue }) => <StatusBadge status={getValue<ReviewStatus>()} />,
    },
    {
      accessorKey: 'finalRecommendation',
      header: 'Recommendation',
      size: 175,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground block truncate max-w-[165px]">
          {getValue<string>() ?? '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { shrink: true, headerClassName: 'text-center' },
      cell: ({ row }) => {
        const r = row.original;
        const isExporting = exportingId === r.id;
        return (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              title="View / Edit"
              onClick={() =>
                navigate(`${rolePrefix}/performance-reviews/${r.id}`)
              }
            >
              <PenLineIcon className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              title="Export PDF"
              disabled={isExporting}
              onClick={() => handleExportPdf(r)}
            >
              {isExporting ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <DownloadIcon className="size-3.5" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-destructive hover:text-destructive"
              title="Delete"
              onClick={() => setDeleteTarget(r)}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Performance Reviews
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI-generated performance reviews for VAs
              </p>
            </div>
            <Button size="sm" onClick={() => setGenerateOpen(true)}>
              <PlusIcon className="size-4" />
              Generate Review
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">VA</span>
              <Select value={vaFilter} onValueChange={setVaFilter}>
                <SelectTrigger className="h-8 w-44 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All VAs</SelectItem>
                  {vaList.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.firstName} {v.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Client</span>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="h-8 w-44 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clientList.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-40 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {REVIEW_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(vaFilter !== 'all' ||
              clientFilter !== 'all' ||
              statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setVaFilter('all');
                  setClientFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear filters
              </button>
            )}

            <span className="ml-auto text-xs text-muted-foreground">
              {reviews.length} record{reviews.length !== 1 ? 's' : ''}
            </span>
          </div>

          <DataTable columns={columns} data={reviews} isLoading={isLoading} />
        </div>
      </div>

      <GenerateReviewModal open={generateOpen} onOpenChange={setGenerateOpen} />

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Review"
        description={`Are you sure you want to delete this performance review? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        variant="destructive"
      />
    </div>
  );
}
