import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  DownloadIcon,
  Loader2Icon,
  LockIcon,
  SaveIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { IPerformanceReview } from '@/types/performance-review';

export function ReviewToolbar({
  review,
  isReadOnly,
  exporting,
  saving,
  onBack,
  onExport,
  onSave,
  onComplete,
}: {
  review: IPerformanceReview;
  isReadOnly: boolean;
  exporting: boolean;
  saving: boolean;
  onBack: () => void;
  onExport: () => void;
  onSave: () => void;
  onComplete: () => void;
}) {
  return (
      <div className="sticky top-0 z-10 bg-background/95 border-b border-border px-4 lg:px-6 py-3">
        <div className="flex items-center gap-3">
          <Button
            size="icon" aria-label="Back to performance reviews"
            variant="ghost"
            className="size-8 shrink-0"
            onClick={onBack}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">
                {review.reviewType} Review
              </span>
              {review.candidateName && (
                <span className="text-muted-foreground text-sm truncate">
                  — {review.candidateName}
                </span>
              )}
              {review?.reviewStatus === 'Completed' && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 rounded bg-white/[0.04] text-text-secondary border border-[rgba(255,255,255,0.08)]">
                  <LockIcon className="size-2.5" />
                  Completed
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-muted-foreground hover:text-foreground border border-border/60"
              onClick={onExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <DownloadIcon className="size-3.5" />
              )}
              <span className="hidden sm:inline ml-1.5">Export PDF</span>
            </Button>

            {!isReadOnly && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={onSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <SaveIcon className="size-3.5" />
                  )}
                  <span className="ml-1.5">Save Draft</span>
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3"
                  onClick={onComplete}
                >
                  <CheckCircle2Icon className="size-3.5" />
                  <span className="ml-1.5 hidden sm:inline">
                    Mark Completed
                  </span>
                  <span className="ml-1.5 sm:hidden">Complete</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
  );
}
