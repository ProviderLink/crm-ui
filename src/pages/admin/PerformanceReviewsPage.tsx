import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { GenerateReviewModal } from '@/components/performance-reviews/GenerateReviewModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';

import { ReviewDrawer } from './performance-review-editor/ReviewDrawer';
import { buildReviewColumns } from './performance-reviews-list/columns';
import { ReviewFilters } from './performance-reviews-list/ReviewFilters';
import { useReviewsList } from './performance-reviews-list/use-reviews-list';

export default function PerformanceReviewsPage() {
  const p = useReviewsList();
  const [openReviewId, setOpenReviewId] = useState<string | null>(null);
  const { isAccountManager } = p;

  const columns = buildReviewColumns({
    vaMap: p.vaMap,
    clientMap: p.clientMap,
    exportingId: p.exportingId,
    onExport: p.handleExportPdf,
    onDelete: p.setDeleteTarget,
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Performance Reviews
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isAccountManager
                  ? 'AI-generated performance reviews for your assigned VAs'
                  : 'AI-generated performance reviews for VAs'}
              </p>
            </div>
            <Button size="sm" onClick={() => p.setGenerateOpen(true)}>
              <PlusIcon className="size-4" />
              Generate Review
            </Button>
          </div>

          <ReviewFilters
            search={p.search}
            onSearchChange={p.setSearch}
            statusFilter={p.statusFilter}
            onStatusChange={p.setStatusFilter}
            recordCount={p.reviews.length}
            isAccountManager={isAccountManager}
          />

          <DataTable
            columns={columns}
            data={p.reviews}
            isLoading={p.isLoading}
            onRowClick={r => setOpenReviewId(r.id)}
          />
        </div>
      </div>

      <GenerateReviewModal
        open={p.generateOpen}
        onOpenChange={p.setGenerateOpen}
        onCreated={setOpenReviewId}
      />

      <ReviewDrawer
        reviewId={openReviewId}
        onClose={() => setOpenReviewId(null)}
      />

      <ConfirmDialog
        open={!!p.deleteTarget}
        onCancel={() => p.setDeleteTarget(null)}
        title="Delete Review"
        description="Are you sure you want to delete this performance review? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (p.deleteTarget) await p.handleDelete(p.deleteTarget);
        }}
        variant="destructive"
      />
    </div>
  );
}
