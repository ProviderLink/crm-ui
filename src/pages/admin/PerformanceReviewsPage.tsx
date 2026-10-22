import { PlusIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { GenerateReviewModal } from '@/components/performance-reviews/GenerateReviewModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';

import { buildReviewColumns } from './performance-reviews-list/columns';
import { ReviewFilters } from './performance-reviews-list/ReviewFilters';
import { useReviewsList } from './performance-reviews-list/use-reviews-list';

export default function PerformanceReviewsPage() {
  const navigate = useNavigate();
  const p = useReviewsList();
  const { isAccountManager } = p;

  const columns = buildReviewColumns({
        vaMap: p.vaMap,
        clientMap: p.clientMap,
        exportingId: p.exportingId,
        isAccountManager,
        onView: r => navigate(`${p.rolePrefix}/performance-reviews/${r.id}`),
        onExport: p.handleExportPdf,
        onDelete: p.setDeleteTarget,
  });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Performance Reviews
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isAccountManager
                  ? 'View performance reviews for your assigned VAs'
                  : 'AI-generated performance reviews for VAs'}
              </p>
            </div>
            {!isAccountManager && (
              <Button size="sm" onClick={() => p.setGenerateOpen(true)}>
                <PlusIcon className="size-4" />
                Generate Review
              </Button>
            )}
          </div>

          <ReviewFilters
            vaFilter={p.vaFilter}
            onVaChange={p.setVaFilter}
            clientFilter={p.clientFilter}
            onClientChange={p.setClientFilter}
            statusFilter={p.statusFilter}
            onStatusChange={p.setStatusFilter}
            vas={p.displayVAs}
            clients={p.displayClients}
            recordCount={p.reviews.length}
            isAccountManager={isAccountManager}
          />

          <DataTable
            columns={columns}
            data={p.reviews}
            isLoading={p.isLoading}
          />
        </div>
      </div>

      <GenerateReviewModal
        open={p.generateOpen}
        onOpenChange={p.setGenerateOpen}
      />

      <ConfirmDialog
        open={!!p.deleteTarget}
        onCancel={() => p.setDeleteTarget(null)}
        title="Delete Review"
        description="Are you sure you want to delete this performance review? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => p.deleteTarget && p.handleDelete(p.deleteTarget)}
        variant="destructive"
      />
    </div>
  );
}
