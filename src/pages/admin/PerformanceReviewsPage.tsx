import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  DownloadIcon,
  EyeIcon,
  Loader2Icon,
  LockIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useAtsVAsQuery,
  useCrmClientUsersQuery,
  useCrmVaUsersQuery,
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
  Draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  'AI Generated': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'In Review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Sent to Client': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Archived: 'bg-zinc-500/8 text-zinc-500 border-zinc-500/15',
};

function StatusBadge({ status }: { status: ReviewStatus }) {
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

function RatingDisplay({ rating }: { rating: number | null }) {
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

export default function PerformanceReviewsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAppSelector(s => s.auth.user);
  const rolePrefix = user?.role === 'admin' ? '/admin' : '/am';
  const isAccountManager = user?.role === 'account_manager';

  // AM scoping: only see reviews for their own assignments
  const { data: amAssignments = [] } = useAllAssignmentsQuery(
    isAccountManager ? user?.id : undefined
  );
  const amCandidateIds = useMemo(
    () => new Set(amAssignments.map(a => a.candidateId).filter(Boolean)),
    [amAssignments]
  );
  const amClientIds = useMemo(
    () => new Set(amAssignments.map(a => a.clientId).filter(Boolean)),
    [amAssignments]
  );

  const [generateOpen, setGenerateOpen] = useState(false);
  const [vaFilter, setVaFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IPerformanceReview | null>(
    null
  );

  const STATUS_TO_BACKEND: Record<string, string> = {
    Draft: 'draft',
    'AI Generated': 'ai_generated',
    'In Review': 'in_review',
    Completed: 'completed',
    'Sent to Client': 'sent_to_client',
    Archived: 'archived',
  };

  const filters: IReviewFilters = {
    candidateId: vaFilter !== 'all' ? vaFilter : undefined,
    clientId: clientFilter !== 'all' ? clientFilter : undefined,
    status:
      statusFilter !== 'all' ? STATUS_TO_BACKEND[statusFilter] : undefined,
  };

  const { data: allReviews = [], isLoading } =
    usePerformanceReviewsQuery(filters);
  const { data: crmVAs = [] } = useCrmVaUsersQuery();
  const { data: atsVAs = [] } = useAtsVAsQuery();
  const { data: clientList = [] } = useAtsClientsQuery();
  const { data: crmClients = [] } = useCrmClientUsersQuery();

  // For AM, client-side filter by their assignments' candidateIds/clientIds
  const reviews = useMemo(() => {
    if (!isAccountManager) return allReviews;
    return allReviews.filter(
      r => amCandidateIds.has(r.vaId) || amClientIds.has(r.clientId)
    );
  }, [allReviews, isAccountManager, amCandidateIds, amClientIds]);

  // Build VA name map: primary source = ATS candidates (vaId matches ATS _id),
  // fallback = CRM VA users by candidateRef or _id
  const vaMap: Record<string, string> = {};
  for (const v of atsVAs) {
    vaMap[v.id] = `${v.firstName} ${v.lastName}`;
  }
  for (const v of crmVAs) {
    const name = `${v.firstName} ${v.lastName}`;
    if (v.candidateRef && !vaMap[v.candidateRef]) vaMap[v.candidateRef] = name;
    if (v._id && !vaMap[v._id]) vaMap[v._id] = name;
  }

  const clientMap: Record<string, string> = {};
  for (const c of clientList) clientMap[c.id] = c.companyName;

  const crmClientRefs = new Set(
    crmClients.map(c => c.clientRef).filter(Boolean)
  );
  const filteredClients = clientList.filter(c => crmClientRefs.has(c.id));

  // AM: restrict VA/client dropdowns to their assignments only
  const displayVAs = useMemo(() => {
    if (!isAccountManager) return atsVAs;
    const amVaIds = new Set(amAssignments.map(a => a.candidateId));
    return atsVAs.filter(v => amVaIds.has(v.id));
  }, [atsVAs, isAccountManager, amAssignments]);

  const displayClients = useMemo(() => {
    if (!isAccountManager) return filteredClients;
    const amClientIdsSet = new Set(amAssignments.map(a => a.clientId));
    return filteredClients.filter(c => amClientIdsSet.has(c.id));
  }, [filteredClients, isAccountManager, amAssignments]);

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
              size="icon"
              variant="ghost"
              className={`size-7 ${isCompleted || isAccountManager ? 'text-muted-foreground' : ''}`}
              title={
                isCompleted || isAccountManager ? 'View (read-only)' : 'Edit'
              }
              onClick={() =>
                navigate(`${rolePrefix}/performance-reviews/${r.id}`)
              }
            >
              <EyeIcon className="size-3.5" />
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
            {!isAccountManager && (
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-destructive/60 hover:text-destructive"
                title="Delete"
                onClick={() => setDeleteTarget(r)}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            )}
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
                {isAccountManager
                  ? 'View performance reviews for your assigned VAs'
                  : 'AI-generated performance reviews for VAs'}
              </p>
            </div>
            {!isAccountManager && (
              <Button size="sm" onClick={() => setGenerateOpen(true)}>
                <PlusIcon className="size-4" />
                Generate Review
              </Button>
            )}
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
                  {displayVAs.map(v => (
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
                  {displayClients.map(c => (
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
            {isAccountManager && (
              <span className="text-[11px] text-muted-foreground/60 ml-1">
                (your assignments)
              </span>
            )}
          </div>

          <DataTable columns={columns} data={reviews} isLoading={isLoading} />
        </div>
      </div>

      <GenerateReviewModal open={generateOpen} onOpenChange={setGenerateOpen} />

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Review"
        description="Are you sure you want to delete this performance review? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        variant="destructive"
      />
    </div>
  );
}
