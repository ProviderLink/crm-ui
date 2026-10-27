import {
  AlertTriangleIcon,
  ClipboardListIcon,
  GripVerticalIcon,
  Loader2Icon,
  StarIcon,
  TargetIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { AddItemButton } from './AddItemButton';
import { AiButton } from './AiButton';
import { CategoriesList } from './CategoriesList';
import { FinalAssessmentCard } from './FinalAssessmentCard';
import { ReviewMetadataCard } from './ReviewMetadataCard';
import { ReviewSaveBar } from './ReviewSaveBar';
import { ReviewToolbar } from './ReviewToolbar';
import { SectionCard } from './SectionCard';
import { StringListEditor } from './StringListEditor';
import { useReviewEditor } from './use-review-editor';

/**
 * A performance review opened in a modal over the list. The editor only mounts
 * while a review is open, so its form state is seeded fresh for each review.
 */
export function ReviewDetailDialog({
  reviewId,
  onClose,
}: {
  reviewId: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!reviewId} onOpenChange={open => !open && onClose()}>
      <DialogContent
        animated={false}
        // Dim and blur the whole screen behind the review.
        overlayClassName="bg-black/80 backdrop-blur-md"
        className="flex h-[88vh] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-visible p-0 [&>button:last-child]:hidden"
        // Clicking the backdrop must not throw away unsaved edits; the close
        // button and Escape still close it.
        onInteractOutside={e => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Performance review</DialogTitle>
        <DialogDescription className="sr-only">
          View and edit this performance review.
        </DialogDescription>
        {/* Outside the panel: beside its top-left corner, or just above it on
            narrow screens where there is no room at the side. */}
        <DialogClose asChild>
          <Button
            size="icon"
            variant="outline"
            aria-label="Close review"
            className="absolute -top-9 left-0 size-8 rounded-md bg-background min-[1000px]:-left-11 min-[1000px]:top-0"
          >
            <XIcon className="size-4" />
          </Button>
        </DialogClose>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
          {reviewId && <ReviewEditor key={reviewId} reviewId={reviewId} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReviewEditor({ reviewId }: { reviewId: string }) {
  const e = useReviewEditor(reviewId);
  const { review, isReadOnly } = e;

  if (e.isLoading) {
    return (
      <>
        <div className="flex flex-1 items-center justify-center">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!review) {
    return (
      <>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Review not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <ReviewToolbar
        review={review}
        isReadOnly={isReadOnly}
        exporting={e.exporting}
        saving={e.saving}
        onExport={e.handleExportPdf}
        onSave={e.handleSaveDraft}
        onComplete={() => e.setCompleteOpen(true)}
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        <div className="space-y-5">
          {!isReadOnly && (
            <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/8 px-4 py-2.5 text-amber-700 dark:text-amber-400">
              <AlertTriangleIcon className="size-4 shrink-0" />
              <p className="text-sm font-medium">
                AI-generated draft — please review and edit before finalizing.
              </p>
            </div>
          )}

          <ReviewMetadataCard review={review} />

          <SectionCard
            icon={<UserIcon className="size-3.5" />}
            title="Role Summary"
          >
            <Textarea
              value={e.roleSummary}
              onChange={ev => e.setRoleSummary(ev.target.value)}
              rows={4}
              placeholder="Describe the VA's role and responsibilities..."
              disabled={isReadOnly}
              className="resize-none"
            />
          </SectionCard>

          <SectionCard
            icon={<ClipboardListIcon className="size-3.5" />}
            title="Manager Summary"
            action={
              !isReadOnly ? (
                <AiButton
                  label="Improve with AI"
                  loading={e.improveLoading}
                  onClick={e.handleImproveManagerSummary}
                />
              ) : undefined
            }
          >
            <Textarea
              value={e.finalManagerSummary}
              onChange={ev => e.setFinalManagerSummary(ev.target.value)}
              rows={4}
              placeholder="Overall manager assessment..."
              disabled={isReadOnly}
              className="resize-none"
            />
          </SectionCard>

          <SectionCard
            icon={<GripVerticalIcon className="size-3.5" />}
            title="Core Responsibilities"
            action={
              !isReadOnly ? (
                <AddItemButton
                  onClick={() =>
                    e.setCoreResponsibilities(prev => [...prev, ''])
                  }
                />
              ) : undefined
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
            icon={<StarIcon className="size-3.5" />}
            title="Performance Categories"
            action={
              !isReadOnly ? (
                <AiButton
                  label="Regenerate"
                  loading={e.regenCatLoading}
                  onClick={e.handleRegenCategories}
                />
              ) : undefined
            }
          >
            {e.categories.length === 0 ? (
              <p className="py-1 text-sm italic text-muted-foreground">
                No categories yet.{' '}
                {!isReadOnly && 'Use "Regenerate" to generate them with AI.'}
              </p>
            ) : (
              <CategoriesList
                categories={e.categories}
                isReadOnly={isReadOnly}
                onChangeField={e.updateCategoryField}
              />
            )}
          </SectionCard>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <SectionCard
              icon={<span className="text-text-secondary">↑</span>}
              title="Strengths"
            >
              <Textarea
                value={e.strengths}
                onChange={ev => e.setStrengths(ev.target.value)}
                rows={5}
                placeholder="What did this VA do well?"
                disabled={isReadOnly}
                className="resize-none"
              />
            </SectionCard>

            <SectionCard
              icon={<span className="text-amber-600">↗</span>}
              title="Areas for Improvement"
            >
              <Textarea
                value={e.areasForImprovement}
                onChange={ev => e.setAreasForImprovement(ev.target.value)}
                rows={5}
                placeholder="What areas need improvement?"
                disabled={isReadOnly}
                className="resize-none"
              />
            </SectionCard>
          </div>

          <SectionCard
            icon={<TargetIcon className="size-3.5" />}
            title="Goals — Next Period"
            action={
              !isReadOnly ? (
                <div className="flex items-center gap-2">
                  <AiButton
                    label="Regenerate"
                    loading={e.regenGoalsLoading}
                    onClick={e.handleRegenGoals}
                  />
                  <AddItemButton
                    onClick={() => e.setGoalsNextPeriod(prev => [...prev, ''])}
                  />
                </div>
              ) : undefined
            }
          >
            <StringListEditor
              items={e.goalsNextPeriod}
              onChange={e.setGoalsNextPeriod}
              placeholder={i => `Goal ${i + 1}`}
              emptyMessage={
                <>
                  No goals listed.{' '}
                  {!isReadOnly && 'Use "Regenerate" to generate them with AI.'}
                </>
              }
              readOnly={isReadOnly}
            />
          </SectionCard>

          <FinalAssessmentCard
            finalRecommendation={e.finalRecommendation}
            onRecommendationChange={e.setFinalRecommendation}
            overallRating={e.overallRating}
            onRatingChange={e.setOverallRating}
            isReadOnly={isReadOnly}
          />

          {!isReadOnly && (
            <ReviewSaveBar
              saving={e.saving}
              onSave={e.handleSaveDraft}
              onComplete={() => e.setCompleteOpen(true)}
            />
          )}
        </div>
      </div>

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
