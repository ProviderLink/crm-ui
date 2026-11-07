import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { QK } from '@/hooks/queries';
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
  IPerformanceReview,
} from '@/types/performance-review';

/**
 * Edit state of one performance review. The form is seeded from the review
 * the first time this runs (the drawer mounts it once per review), so a
 * refetch after a save, or after regenerating one section, never overwrites
 * edits made elsewhere in the form; the AI handlers below update their own
 * section from the response. `review` itself stays live for status and name.
 */
export function useReviewEditor(review: IPerformanceReview) {
  const queryClient = useQueryClient();
  const id = review.id;
  const isReadOnly = review.reviewStatus === 'Completed';

  // Form state
  const [roleSummary, setRoleSummary] = useState(review.roleSummary ?? '');
  const [coreResponsibilities, setCoreResponsibilities] = useState<string[]>(
    review.coreResponsibilities ?? []
  );
  const [categories, setCategories] = useState<IPerformanceCategory[]>(
    review.categories ?? []
  );
  const [strengths, setStrengths] = useState(review.strengths ?? '');
  const [areasForImprovement, setAreasForImprovement] = useState(
    review.areasForImprovement ?? ''
  );
  const [goalsNextPeriod, setGoalsNextPeriod] = useState<string[]>(
    review.goalsNextPeriod ?? []
  );
  const [finalRecommendation, setFinalRecommendation] = useState<
    FinalRecommendation | ''
  >(review.finalRecommendation ?? '');
  const [overallRating, setOverallRating] = useState<string>(
    review.overallRating ? String(review.overallRating) : ''
  );
  const [finalManagerSummary, setFinalManagerSummary] = useState(
    review.finalManagerSummary ?? ''
  );

  // What the form holds now, as one string, to tell whether it differs from
  // what was last saved (or loaded). Closing then asks before dropping edits.
  const snapshot = () =>
    JSON.stringify([
      roleSummary,
      coreResponsibilities,
      categories,
      strengths,
      areasForImprovement,
      goalsNextPeriod,
      finalRecommendation,
      overallRating,
      finalManagerSummary,
    ]);
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);
  const isDirty = !isReadOnly && snapshot() !== savedSnapshot;

  // AI loading states
  const [regenCatLoading, setRegenCatLoading] = useState(false);
  const [regenGoalsLoading, setRegenGoalsLoading] = useState(false);
  const [improveLoading, setImproveLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: QK.performanceReview(id) });
    void queryClient.invalidateQueries({ queryKey: QK.performanceReviews() });
  }

  async function handleSaveDraft() {
    const sent = snapshot();
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
          review.reviewStatus === 'Draft' ||
          review.reviewStatus === 'AI Generated'
            ? 'In Review'
            : review.reviewStatus,
      });
      setSavedSnapshot(sent);
      invalidate();
      toast.success('Saved');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenCategories() {
    setRegenCatLoading(true);
    try {
      // Save the ratings and comments on screen first, so the server can keep
      // them on every category that keeps its name.
      if (isDirty) await updateReview(id, { categories });
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
    setExporting(true);
    try {
      await exportReviewPdf(id, review.candidateName);
    } catch {
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleMarkCompleted() {
    const sent = snapshot();
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
      setSavedSnapshot(sent);
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
    isReadOnly,
    isDirty,
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
