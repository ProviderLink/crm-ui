import { PlusIcon } from 'lucide-react';

import { DataTable } from '@/components/shared/DataTable';
import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import { Button } from '@/components/ui/button';
import { ReviewFilters } from '@/features/reviews/list/ReviewFilters';
import { ReviewsOverlays } from '@/features/reviews/list/ReviewsOverlays';
import { useReviewsList } from '@/features/reviews/list/use-reviews-list';

export default function PerformanceReviewsPage() {
  const p = useReviewsList();

  return (
    <Page overlays={<ReviewsOverlays list={p} />}>
      <PageSection>
        <PageHeader
          title="Performance Reviews"
          description="AI-generated performance reviews for VAs"
          actions={
            <Button size="sm" onClick={() => p.setGenerateOpen(true)}>
              <PlusIcon className="size-4" />
              Generate Review
            </Button>
          }
        />

        <ReviewFilters
          search={p.search}
          onSearchChange={p.setSearch}
          statusFilter={p.statusFilter}
          onStatusChange={p.setStatusFilter}
          recordCount={p.reviews.length}
        />

        <DataTable
          columns={p.columns}
          data={p.reviews}
          isLoading={p.isLoading}
          isError={p.isError}
          error={p.error}
          onRowClick={r => p.setOpenReviewId(r.id)}
        />
      </PageSection>
    </Page>
  );
}
