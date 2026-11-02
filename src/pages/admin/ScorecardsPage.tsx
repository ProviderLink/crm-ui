import { RefreshCwIcon } from 'lucide-react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import { Button } from '@/components/ui/button';
import { buildScorecardColumns } from '@/features/scorecards/scorecard-columns';
import { ScorecardFilters } from '@/features/scorecards/ScorecardFilters';
import { useScorecardGenerate } from '@/features/scorecards/use-scorecard-generate';
import { useScorecardView } from '@/features/scorecards/use-scorecard-view';
import { useScorecardsQuery } from '@/hooks/queries';
import { useVaNames } from '@/hooks/use-name-maps';
import type { IScorecard } from '@/types/scorecard';

export default function ScorecardsPage() {
  const {
    data: scorecards = [],
    isLoading,
    isError,
    error,
  } = useScorecardsQuery();
  const vaMap = useVaNames();
  const nameOf = (s: IScorecard) => s.vaName || vaMap[s.vaId] || 'Unknown VA';

  const view = useScorecardView(scorecards, nameOf);
  const generate = useScorecardGenerate();

  return (
    <Page>
      <PageSection>
        <PageHeader
          title="Productivity Scorecards"
          description="Weekly performance scores"
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={() => generate.setConfirmOpen(true)}
              disabled={generate.generating}
            >
              <RefreshCwIcon
                className={`size-3.5 ${generate.generating ? 'animate-spin' : ''}`}
              />
              {generate.generating ? 'Generating…' : 'Generate scorecards'}
            </Button>
          }
        />

        <ScorecardFilters
          search={view.search}
          onSearchChange={view.setSearch}
          week={view.week}
          weeks={view.weeks}
          onWeekChange={view.setWeekChoice}
          count={view.rows.length}
          error={generate.error}
        />

        <DataTable
          columns={buildScorecardColumns(nameOf)}
          data={view.rows}
          isLoading={isLoading}
          isError={isError}
          error={error}
        />

        <ConfirmDialog
          open={generate.confirmOpen}
          title="Generate Scorecards"
          description="Generate scorecards for ALL VAs for the current week. This may take a moment."
          onConfirm={generate.confirm}
          onCancel={() => generate.setConfirmOpen(false)}
        />
      </PageSection>
    </Page>
  );
}
