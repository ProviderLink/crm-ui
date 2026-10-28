import {
  DownloadIcon,
  Loader2Icon,
  LockIcon,
  SaveIcon,
  XIcon,
} from 'lucide-react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

import { StatusBadge } from '../performance-reviews-list/badges';
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
  return (
    <Sheet open={!!reviewId} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="right"
        // Floats with a gap to the viewport; the built-in close button is
        // hidden in favour of the one below, outside the drawer's top-left.
        className="flex w-[calc(100vw-2rem)] flex-col gap-0 overflow-visible border-white/[0.14] bg-surface-raised p-0 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9)] sm:max-w-2xl [&>button:last-child]:hidden"
        // Clicking the backdrop must not throw away unsaved edits; the close
        // button and Escape still close it.
        onInteractOutside={e => e.preventDefault()}
      >
        <SheetTitle className="sr-only">Performance review</SheetTitle>
        <SheetDescription className="sr-only">
          View and edit this performance review.
        </SheetDescription>
        {/* Beside the drawer's top-left corner when there is room; inside
            its top-right corner on narrow screens. */}
        <SheetClose asChild>
          <Button
            size="icon"
            variant="outline"
            aria-label="Close review"
            className="absolute right-3 top-3 z-10 size-8 rounded-md border-white/[0.14] bg-surface-raised min-[800px]:-left-11 min-[800px]:right-auto min-[800px]:top-0"
          >
            <XIcon className="size-4" />
          </Button>
        </SheetClose>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
          {reviewId && <ReviewEditor key={reviewId} reviewId={reviewId} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ReviewEditor({ reviewId }: { reviewId: string }) {
  const e = useReviewEditor(reviewId);
  const { review, isReadOnly } = e;

  if (e.isLoading) {
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

  return (
    <>
      {/* Header — right padding keeps clear of the drawer's close button. */}
      <header className="flex items-start gap-3 border-b border-border px-6 py-4 pr-14 min-[800px]:pr-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold">
              {review.candidateName ?? 'Performance review'}
            </h2>
            <StatusBadge status={review.reviewStatus} />
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
      </header>

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
                onClick={e.handleRegenCategories}
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
