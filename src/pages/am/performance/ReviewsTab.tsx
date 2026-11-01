import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import {
  ClearFiltersButton,
  SearchInput,
} from '@/components/shared/FilterControls';
import { GenerateReviewModal } from '@/components/performance-reviews/GenerateReviewModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import type {
  IPerformanceReview,
  ReviewStatus,
} from '@/types/performance-review';

import { ReviewDrawer } from '../../admin/performance-review-editor/ReviewDrawer';
import { buildReviewColumns } from '../../admin/performance-reviews-list/columns';
import { useReviewsList } from '../../admin/performance-reviews-list/use-reviews-list';

type View = 'todo' | 'done' | 'all';

// Reviews still waiting on the manager, and the ones that are finished.
const TODO: ReviewStatus[] = ['Draft', 'AI Generated', 'In Review'];
const DONE: ReviewStatus[] = ['Completed', 'Sent to Client'];

const VIEWS: { key: View; label: string }[] = [
  { key: 'todo', label: 'To review' },
  { key: 'done', label: 'Completed' },
  { key: 'all', label: 'All' },
];

const inView = (r: IPerformanceReview, view: View) =>
  view === 'all' || (view === 'todo' ? TODO : DONE).includes(r.reviewStatus);

export function ReviewsTab() {
  const p = useReviewsList();
  const [openReviewId, setOpenReviewId] = useState<string | null>(null);
  const [view, setView] = useState<View>('todo');

  const columns = buildReviewColumns({
    vaMap: p.vaMap,
    clientMap: p.clientMap,
    exportingId: p.exportingId,
    onExport: p.handleExportPdf,
    onDelete: p.setDeleteTarget,
  });

  const rows = p.reviews.filter(r => inView(r, view));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          value={p.search}
          onChange={p.setSearch}
          placeholder="Search VA or client…"
          label="Search by VA or client"
        />

        <div className="flex items-center gap-1">
          {VIEWS.map(v => {
            const n = p.reviews.filter(r => inView(r, v.key)).length;
            const active = view === v.key;
            return (
              <Button
                key={v.key}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={active}
                onClick={() => setView(v.key)}
                className={`h-8 gap-1.5 text-sm ${active ? 'border-border-strong bg-white/[0.08] text-foreground' : 'text-muted-foreground'}`}
              >
                {v.label}
                {!p.isLoading && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {n}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {p.search && <ClearFiltersButton onClick={() => p.setSearch('')} />}

        <Button
          size="sm"
          className="ml-auto h-8"
          onClick={() => p.setGenerateOpen(true)}
        >
          <PlusIcon className="size-4" />
          Generate Review
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={p.isLoading}
        onRowClick={r => setOpenReviewId(r.id)}
      />

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
    </>
  );
}
