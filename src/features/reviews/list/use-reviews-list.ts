import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useRole } from '@/hooks/use-role';
import {
  QK,
  useAllAssignmentsQuery,
  usePerformanceReviewsQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { useClientNames, useVaNames } from '@/hooks/use-name-maps';
import { reviewsInScope } from '../scope';
import { buildReviewColumns } from './columns';
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
  const { isAccountManager } = useRole();

  // AM scoping: only see reviews for their own assignments (admins need none).
  const { data: amAssignments = [] } = useAllAssignmentsQuery(
    isAccountManager ? user?.id : undefined,
    isAccountManager
  );

  const [generateOpen, setGenerateOpen] = useState(false);
  const [openReviewId, setOpenReviewId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IPerformanceReview | null>(
    null
  );

  const filters: IReviewFilters = {
    status:
      statusFilter !== 'all'
        ? STATUS_TO_BACKEND[statusFilter as ReviewStatus]
        : undefined,
  };

  const {
    data: allReviews = [],
    isLoading,
    isError,
    error,
  } = usePerformanceReviewsQuery(filters);
  const vaMap = useVaNames();
  const clientMap = useClientNames();

  // For an AM, only the reviews of their own VA–client pairs.
  const scopedReviews = useMemo(
    () =>
      isAccountManager ? reviewsInScope(allReviews, amAssignments) : allReviews,
    [allReviews, isAccountManager, amAssignments]
  );

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
      await exportReviewPdf(
        review.id,
        review.candidateName ?? vaMap[review.vaId]
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
      void queryClient.invalidateQueries({ queryKey: QK.performanceReviews() });
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

  const columns = buildReviewColumns({
    vaMap,
    clientMap,
    exportingId,
    onExport: (review: IPerformanceReview) => void handleExportPdf(review),
    onDelete: setDeleteTarget,
  });

  return {
    columns,
    isLoading,
    isError,
    error,
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
    openReviewId,
    setOpenReviewId,
    handleExportPdf,
    handleDelete,
  };
}
