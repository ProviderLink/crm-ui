import { DownloadIcon, Loader2Icon, LockIcon, SaveIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { DetailDrawer, DrawerHeader } from '@/components/shared/DetailDrawer';
import { usePerformanceReviewQuery } from '@/hooks/queries';
import type { IPerformanceReview } from '@/types/performance-review';
import { ReviewStatusBadge } from '@/components/shared/badges';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorNotice } from '@/components/shared/ErrorNotice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { AddItemButton } from './AddItemButton';
import { AiButton } from './AiButton';
import { CategoriesList } from './CategoriesList';
import { FinalAssessmentCard } from './FinalAssessmentCard';
import { ReviewMetadataCard } from './ReviewMetadataCard';
import { SectionCard } from './SectionCard';
import { StringListEditor } from './StringListEditor';
import { useReviewEditor } from './use-review-editor';

/**
 * A performance review opened in a side drawer over the list. The editor only
 * mounts while a review is open, so its form state is seeded fresh each time.
 */
export function ReviewDrawer({
  reviewId,
  onClose,
}: {
  reviewId: string | null;
  onClose: () => void;
}) {
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // Esc or the close button must not throw away unsaved edits unasked.
  function requestClose() {
    if (dirty) setConfirmClose(true);
    else onClose();
  }

  return (
    <>
      <DetailDrawer
        open={!!reviewId}
        onOpenChange={open => !open && requestClose()}
        width="2xl"
        closeLabel="Close review"
        srTitle="Performance review"
        srDescription="View and edit this performance review."
        keepOpenOnOutsideClick
      >
        {reviewId && (
          <ReviewEditor
            key={reviewId}
            reviewId={reviewId}
            onDirtyChange={setDirty}
          />
        )}
      </DetailDrawer>
      <ConfirmDialog
        open={confirmClose}
        onCancel={() => setConfirmClose(false)}
        title="Discard unsaved changes?"
        description="Your edits to this review have not been saved. Closing now will lose them."
        confirmLabel="Discard changes"
        onConfirm={() => {
          setConfirmClose(false);
          setDirty(false);
          onClose();
        }}
      />
    </>
  );
}

/** Loads the review, then hands it to the editor that seeds its form from it. */
function ReviewEditor({
  reviewId,
  onDirtyChange,
}: {
  reviewId: string;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const {
    data: review,
    isLoading,
    isError,
    error,
    isPlaceholderData,
    refetch,
  } = usePerformanceReviewQuery(reviewId);

  if (isError && !review) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <ErrorNotice
          error={error}
          fallback="Could not load this review. Please try again."
        />
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  // The list's copy is shown while loading, but the form is seeded only once,
  // so it must wait for the full review or edits would start from a stale one.
  if (isLoading || isPlaceholderData) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Review not found.</p>
      </div>
    );
  }

  return <ReviewEditorForm review={review} onDirtyChange={onDirtyChange} />;
}

function ReviewEditorForm({
  review,
  onDirtyChange,
}: {
  review: IPerformanceReview;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const e = useReviewEditor(review);
  const { isReadOnly, isDirty } = e;
  const [regenConfirm, setRegenConfirm] = useState(false);

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  // Regenerating replaces every category, so ratings already typed would go.
  const hasCategoryEdits = e.categories.some(
    c => c.rating !== null || !!c.managerComments?.trim()
  );

  return (
    <>
      {/* Header — right padding keeps clear of the drawer's close button. */}
      <DrawerHeader className="items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold">
              {review.candidateName ?? 'Performance review'}
            </h2>
            <ReviewStatusBadge status={review.reviewStatus} />
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {review.reviewType} review
            {review.clientName && ` · ${review.clientName}`}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 shrink-0"
          onClick={e.handleExportPdf}
          disabled={e.exporting}
        >
          {e.exporting ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <DownloadIcon className="size-3.5" />
          )}
          <span className="hidden sm:inline">Export PDF</span>
        </Button>
      </DrawerHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-5 space-y-3">
          {!isReadOnly && (
            <p className="text-xs text-muted-foreground">
              AI-generated draft — review and edit before finalizing.
            </p>
          )}
          <ReviewMetadataCard review={review} />
        </div>

        <SectionCard title="Role summary">
          <Textarea
            value={e.roleSummary}
            onChange={ev => e.setRoleSummary(ev.target.value)}
            rows={4}
            placeholder="Describe the VA's role and responsibilities…"
            disabled={isReadOnly}
            className="resize-none"
          />
        </SectionCard>

        <SectionCard
          title="Manager summary"
          action={
            !isReadOnly && (
              <AiButton
                label="Improve with AI"
                loading={e.improveLoading}
                onClick={e.handleImproveManagerSummary}
              />
            )
          }
        >
          <Textarea
            value={e.finalManagerSummary}
            onChange={ev => e.setFinalManagerSummary(ev.target.value)}
            rows={4}
            placeholder="Overall manager assessment…"
            disabled={isReadOnly}
            className="resize-none"
          />
        </SectionCard>

        <SectionCard
          title="Core responsibilities"
          action={
            !isReadOnly && (
              <AddItemButton
                onClick={() => e.setCoreResponsibilities(prev => [...prev, ''])}
              />
            )
          }
        >
          <StringListEditor
            items={e.coreResponsibilities}
            onChange={e.setCoreResponsibilities}
            placeholder={i => `Responsibility ${i + 1}`}
            emptyMessage="No responsibilities listed."
            readOnly={isReadOnly}
          />
        </SectionCard>

        <SectionCard
          title="Performance categories"
          action={
            !isReadOnly && (
              <AiButton
                label="Regenerate"
                loading={e.regenCatLoading}
                onClick={() =>
                  hasCategoryEdits
                    ? setRegenConfirm(true)
                    : e.handleRegenCategories()
                }
              />
            )
          }
        >
          {e.categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories yet.{' '}
              {!isReadOnly && 'Use “Regenerate” to generate them with AI.'}
            </p>
          ) : (
            <CategoriesList
              categories={e.categories}
              isReadOnly={isReadOnly}
              onChangeField={e.updateCategoryField}
            />
          )}
        </SectionCard>

        <SectionCard title="Strengths">
          <Textarea
            value={e.strengths}
            onChange={ev => e.setStrengths(ev.target.value)}
            rows={5}
            placeholder="What did this VA do well?"
            disabled={isReadOnly}
            className="resize-none"
          />
        </SectionCard>

        <SectionCard title="Areas for improvement">
          <Textarea
            value={e.areasForImprovement}
            onChange={ev => e.setAreasForImprovement(ev.target.value)}
            rows={5}
            placeholder="What areas need improvement?"
            disabled={isReadOnly}
            className="resize-none"
          />
        </SectionCard>

        <SectionCard
          title="Goals for next period"
          action={
            !isReadOnly && (
              <>
                <AiButton
                  label="Regenerate"
                  loading={e.regenGoalsLoading}
                  onClick={e.handleRegenGoals}
                />
                <AddItemButton
                  onClick={() => e.setGoalsNextPeriod(prev => [...prev, ''])}
                />
              </>
            )
          }
        >
          <StringListEditor
            items={e.goalsNextPeriod}
            onChange={e.setGoalsNextPeriod}
            placeholder={i => `Goal ${i + 1}`}
            emptyMessage={
              <>
                No goals listed.{' '}
                {!isReadOnly && 'Use “Regenerate” to generate them with AI.'}
              </>
            }
            readOnly={isReadOnly}
          />
        </SectionCard>

        <SectionCard title="Final assessment">
          <FinalAssessmentCard
            finalRecommendation={e.finalRecommendation}
            onRecommendationChange={e.setFinalRecommendation}
            overallRating={e.overallRating}
            onRatingChange={e.setOverallRating}
            isReadOnly={isReadOnly}
          />
        </SectionCard>
      </div>

      {/* Footer — always visible, so saving never needs a scroll. */}
      <footer className="flex items-center justify-between gap-3 border-t border-border px-6 py-3">
        {isReadOnly ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LockIcon className="size-3.5" />
            Completed reviews are locked.
          </p>
        ) : (
          <>
            <span />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={e.handleSaveDraft}
                disabled={e.saving}
              >
                {e.saving ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SaveIcon className="size-4" />
                )}
                Save draft
              </Button>
              <Button size="sm" onClick={() => e.setCompleteOpen(true)}>
                Mark completed
              </Button>
            </div>
          </>
        )}
      </footer>

      <ConfirmDialog
        open={regenConfirm}
        onCancel={() => setRegenConfirm(false)}
        title="Regenerate categories?"
        description="This replaces all categories, including the ratings and comments you have entered."
        confirmLabel="Regenerate"
        variant="default"
        onConfirm={async () => {
          setRegenConfirm(false);
          await e.handleRegenCategories();
        }}
      />

      <ConfirmDialog
        open={e.completeOpen}
        onCancel={() => e.setCompleteOpen(false)}
        title="Mark Review as Completed"
        description="Once completed, the review will be locked and no further edits can be made. Are you sure?"
        confirmLabel={e.completing ? 'Completing…' : 'Mark Completed'}
        onConfirm={e.handleMarkCompleted}
        variant="default"
      />
    </>
  );
}
