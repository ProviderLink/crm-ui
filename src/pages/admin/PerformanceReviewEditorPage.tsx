import {
  AlertTriangleIcon,
  ClipboardListIcon,
  GripVerticalIcon,
  Loader2Icon,
  StarIcon,
  TargetIcon,
  UserIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Textarea } from '@/components/ui/textarea';

import { AddItemButton } from './performance-review-editor/AddItemButton';
import { AiButton } from './performance-review-editor/AiButton';
import { CategoriesList } from './performance-review-editor/CategoriesList';
import { FinalAssessmentCard } from './performance-review-editor/FinalAssessmentCard';
import { ReviewMetadataCard } from './performance-review-editor/ReviewMetadataCard';
import { ReviewSaveBar } from './performance-review-editor/ReviewSaveBar';
import { ReviewToolbar } from './performance-review-editor/ReviewToolbar';
import { SectionCard } from './performance-review-editor/SectionCard';
import { StringListEditor } from './performance-review-editor/StringListEditor';
import { useReviewEditor } from './performance-review-editor/use-review-editor';

export default function PerformanceReviewEditorPage() {
  const navigate = useNavigate();
  const e = useReviewEditor();
  const { review, isReadOnly } = e;

  if (e.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[400px]">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Review not found.</p>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col">
      <ReviewToolbar
        review={review}
        isReadOnly={isReadOnly}
        exporting={e.exporting}
        saving={e.saving}
        onBack={() => navigate(`${e.rolePrefix}/performance-reviews`)}
        onExport={e.handleExportPdf}
        onSave={e.handleSaveDraft}
        onComplete={() => e.setCompleteOpen(true)}
      />

      {/* ── Page body ────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 lg:px-6 py-6">
        <div className="space-y-5">
          {/* AI disclaimer */}
          {!isReadOnly && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-amber-500/8 border border-amber-500/25 text-amber-700 dark:text-amber-400">
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
                  onClick={() => e.setCoreResponsibilities(prev => [...prev, ''])}
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
              <p className="text-sm text-muted-foreground italic py-1">
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

          {/* ── Strengths + Areas (side by side) ─────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
    </div>
  );
}
