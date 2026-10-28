import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  QK,
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useAtsVAsQuery,
  useCrmVaUsersQuery,
  usePerformanceReviewsQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import {
  deleteReview,
  exportReviewPdf,
  type IReviewFilters,
} from '@/services/performance-reviews.service';
import type { IPerformanceReview } from '@/types/performance-review';

export function useReviewsList() {
  const queryClient = useQueryClient();
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
  const [search, setSearch] = useState('');
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
    status:
      statusFilter !== 'all' ? STATUS_TO_BACKEND[statusFilter] : undefined,
  };

  const { data: allReviews = [], isLoading } =
    usePerformanceReviewsQuery(filters);
  const { data: crmVAs = [] } = useCrmVaUsersQuery();
  const { data: atsVAs = [] } = useAtsVAsQuery();
  const { data: clientList = [] } = useAtsClientsQuery();

  // For AM, client-side filter by their assignments' candidateIds/clientIds
  const scopedReviews = useMemo(() => {
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

  // Search matches the VA or the client name, case-insensitively.
  const query = search.trim().toLowerCase();
  const reviews = query
    ? scopedReviews.filter(r => {
        const va = r.candidateName ?? vaMap[r.vaId] ?? '';
        const client = r.clientName ?? clientMap[r.clientId] ?? '';
        return `${va} ${client}`.toLowerCase().includes(query);
      })
    : scopedReviews;

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

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
  }

  return {
    user,
    rolePrefix,
    isAccountManager,
    isLoading,
    reviews,
    vaMap,
    clientMap,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    clearFilters,
    exportingId,
    deleteTarget,
    setDeleteTarget,
    generateOpen,
    setGenerateOpen,
    handleExportPdf,
    handleDelete,
  };
}
