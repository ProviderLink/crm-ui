import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ReviewDrawer } from '@/features/reviews/editor/ReviewDrawer';
import { GenerateReviewModal } from '@/features/reviews/generate/GenerateReviewModal';

import type { useReviewsList } from './use-reviews-list';

/**
 * What opens over a reviews list: the generate dialog, the review itself and
 * the delete confirmation. All of it is driven by `useReviewsList`.
 */
export function ReviewsOverlays({
  list,
}: {
  list: ReturnType<typeof useReviewsList>;
}) {
  return (
    <>
      <GenerateReviewModal
        open={list.generateOpen}
        onOpenChange={list.setGenerateOpen}
        onCreated={list.setOpenReviewId}
      />

      <ReviewDrawer
        reviewId={list.openReviewId}
        onClose={() => list.setOpenReviewId(null)}
      />

      <ConfirmDialog
        open={!!list.deleteTarget}
        onCancel={() => list.setDeleteTarget(null)}
        title="Delete Review"
        description="Are you sure you want to delete this performance review? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (list.deleteTarget) await list.handleDelete(list.deleteTarget);
        }}
        variant="destructive"
      />
    </>
  );
}
