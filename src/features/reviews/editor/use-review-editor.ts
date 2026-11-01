import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { QK, usePerformanceReviewQuery } from '@/hooks/queries';
import {
  completeReview,
  exportReviewPdf,
  improveManagerSummary,
  regenerateCategories,
  regenerateGoals,
  updateReview,
} from '@/services/performance-reviews.service';
import type {
  FinalRecommendation,
  IPerformanceCategory,
} from '@/types/performance-review';

export function useReviewEditor(id: string) {
  const queryClient = useQueryClient();

  const { data: review, isLoading } = usePerformanceReviewQuery(id);
  const isReadOnly = review?.reviewStatus === 'Completed';

  // Form state
  const [roleSummary, setRoleSummary] = useState('');
  const [coreResponsibilities, setCoreResponsibilities] = useState<string[]>(
    []
  );
  const [categories, setCategories] = useState<IPerformanceCategory[]>([]);
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [goalsNextPeriod, setGoalsNextPeriod] = useState<string[]>([]);
  const [finalRecommendation, setFinalRecommendation] = useState<
    FinalRecommendation | ''
  >('');
  const [overallRating, setOverallRating] = useState<string>('');
  const [finalManagerSummary, setFinalManagerSummary] = useState('');

  // AI loading states
  const [regenCatLoading, setRegenCatLoading] = useState(false);
  const [regenGoalsLoading, setRegenGoalsLoading] = useState(false);
  const [improveLoading, setImproveLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Seed the form once per review. Refetches (after save, or after
  // regenerating one section) must not overwrite edits made elsewhere in the
  // form; the AI handlers below update their own section from the response.
  const seededReviewId = useRef<string | null>(null);

  useEffect(() => {
    if (!review || seededReviewId.current === review.id) return;
    seededReviewId.current = review.id;
    setRoleSummary(review.roleSummary ?? '');
    setCoreResponsibilities(review.coreResponsibilities ?? []);
    setCategories(review.categories ?? []);
    setStrengths(review.strengths ?? '');
    setAreasForImprovement(review.areasForImprovement ?? '');
    setGoalsNextPeriod(review.goalsNextPeriod ?? []);
    setFinalRecommendation(review.finalRecommendation ?? '');
    setOverallRating(review.overallRating ? String(review.overallRating) : '');
    setFinalManagerSummary(review.finalManagerSummary ?? '');
  }, [review]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: QK.performanceReview(id!) });
    queryClient.invalidateQueries({ queryKey: QK.performanceReviews() });
  }

  async function handleSaveDraft() {
    if (!id) return;
    setSaving(true);
    try {
      await updateReview(id, {
        roleSummary,
        coreResponsibilities,
        strengths,
        areasForImprovement,
        goalsNextPeriod,
        finalRecommendation: finalRecommendation || null,
        overallRating: overallRating ? parseInt(overallRating, 10) : null,
        finalManagerSummary,
        categories,
        reviewStatus:
          review?.reviewStatus === 'Draft' ||
          review?.reviewStatus === 'AI Generated'
            ? 'In Review'
            : review?.reviewStatus,
      });
      invalidate();
      toast.success('Saved');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenCategories() {
    if (!id) return;
    setRegenCatLoading(true);
    try {
      const updated = await regenerateCategories(id);
      setCategories(updated.categories ?? []);
      invalidate();
      toast.success('Categories regenerated');
    } catch {
      toast.error('Failed to regenerate categories.');
    } finally {
      setRegenCatLoading(false);
    }
  }

  async function handleRegenGoals() {
    if (!id) return;
    setRegenGoalsLoading(true);
    try {
      const updated = await regenerateGoals(id);
      setGoalsNextPeriod(updated.goalsNextPeriod ?? []);
      invalidate();
      toast.success('Goals regenerated');
    } catch {
      toast.error('Failed to regenerate goals.');
    } finally {
      setRegenGoalsLoading(false);
    }
  }

  async function handleImproveManagerSummary() {
    if (!id) return;
    setImproveLoading(true);
    try {
      const updated = await improveManagerSummary(id);
      setFinalManagerSummary(updated.finalManagerSummary ?? '');
      invalidate();
      toast.success('Manager summary improved');
    } catch {
      toast.error('Failed to improve summary.');
    } finally {
      setImproveLoading(false);
    }
  }

  async function handleExportPdf() {
    if (!id) return;
    setExporting(true);
    try {
      const name = review?.candidateName ?? 'review';
      await exportReviewPdf(
        id,
        `performance-review-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`
      );
    } catch {
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleMarkCompleted() {
    if (!id) return;
    setCompleting(true);
    try {
      // Save all current form state before completing so no selections are lost
      await updateReview(id, {
        roleSummary,
        coreResponsibilities,
        strengths,
        areasForImprovement,
        goalsNextPeriod,
        finalRecommendation: finalRecommendation || null,
        overallRating: overallRating ? parseInt(overallRating, 10) : null,
        finalManagerSummary,
        categories,
      });
      await completeReview(id);
      invalidate();
      toast.success('Review marked as Completed');
      setCompleteOpen(false);
    } catch {
      toast.error('Failed to complete review.');
    } finally {
      setCompleting(false);
    }
  }

  function updateCategoryField(
    catId: string,
    field: 'rating' | 'managerComments',
    value: number | null | string
  ) {
    setCategories(prev =>
      prev.map(c => (c.id === catId ? { ...c, [field]: value } : c))
    );
  }

  return {
    review,
    isLoading,
    isReadOnly,
    roleSummary,
    setRoleSummary,
    coreResponsibilities,
    setCoreResponsibilities,
    categories,
    strengths,
    setStrengths,
    areasForImprovement,
    setAreasForImprovement,
    goalsNextPeriod,
    setGoalsNextPeriod,
    finalRecommendation,
    setFinalRecommendation,
    overallRating,
    setOverallRating,
    finalManagerSummary,
    setFinalManagerSummary,
    regenCatLoading,
    regenGoalsLoading,
    improveLoading,
    saving,
    exporting,
    completeOpen,
    setCompleteOpen,
    completing,
    handleSaveDraft,
    handleRegenCategories,
    handleRegenGoals,
    handleImproveManagerSummary,
    handleExportPdf,
    handleMarkCompleted,
    updateCategoryField,
  };
}
