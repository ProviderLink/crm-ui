import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  QK,
  useAllAssignmentsQuery,
  usePerformanceReviewsQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { useClientNames, useVaNames } from '@/hooks/use-name-maps';
import {
  deleteReview,
  exportReviewPdf,
  STATUS_TO_BACKEND,
  type IReviewFilters,
} from '@/services/performance-reviews.service';
import type {
  IPerformanceReview,
  ReviewStatus,
} from '@/types/performance-review';

export function useReviewsList() {
  const queryClient = useQueryClient();
  const user = useAppSelector(s => s.auth.user);
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

  const filters: IReviewFilters = {
    status:
      statusFilter !== 'all' ? STATUS_TO_BACKEND[statusFilter as ReviewStatus] : undefined,
  };

  const { data: allReviews = [], isLoading } =
    usePerformanceReviewsQuery(filters);
  const vaMap = useVaNames();
  const clientMap = useClientNames();

  // For AM, client-side filter by their assignments' candidateIds/clientIds
  const scopedReviews = useMemo(() => {
    if (!isAccountManager) return allReviews;
    return allReviews.filter(
      r => amCandidateIds.has(r.vaId) || amClientIds.has(r.clientId)
    );
  }, [allReviews, isAccountManager, amCandidateIds, amClientIds]);

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
