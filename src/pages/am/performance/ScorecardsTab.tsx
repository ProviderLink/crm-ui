import { RefreshCwIcon } from 'lucide-react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { StatTile } from '@/components/shared/StatTile';
import { Button } from '@/components/ui/button';
import { buildScorecardColumns } from '@/features/scorecards/scorecard-columns';
import { ScorecardFilters } from '@/features/scorecards/ScorecardFilters';
import { scoreColor } from '@/features/scorecards/score';

import { useAmScorecards } from './use-am-scorecards';

export function ScorecardsTab() {
  const s = useAmScorecards();
  const { generate } = s;
  const none = s.rows.length === 0;

  return (
    <>
      <ScorecardFilters
        search={s.search}
        onSearchChange={s.setSearch}
        week={s.week}
        weeks={s.weeks}
        onWeekChange={s.setWeekChoice}
        count={s.rows.length}
        error={generate.error}
        trailing={
          <Button
            size="sm"
            variant="outline"
            className="h-8"
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

      {/* The selected week in numbers */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          size="md"
          label="Average score"
          value={
            s.isLoading || s.avgScore === null ? '—' : s.avgScore.toFixed(0)
          }
          valueClassName={s.avgScore === null ? '' : scoreColor(s.avgScore)}
        />
        <StatTile
          size="md"
          label="Lowest score"
          value={
            s.isLoading || !s.lowest
              ? '—'
              : s.lowest.productivityScore.toFixed(0)
          }
          sub={s.lowest ? s.nameOf(s.lowest) : undefined}
          valueClassName={
            s.lowest ? scoreColor(s.lowest.productivityScore) : ''
          }
        />
        <StatTile
          size="md"
          label="Average EOD rate"
          value={
            s.isLoading || s.avgEod === null ? '—' : `${s.avgEod.toFixed(0)}%`
          }
          valueClassName={s.avgEod === null ? '' : scoreColor(s.avgEod)}
        />
      </div>

      {!s.isLoading && !s.isError && none && !s.search ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No scorecards for this period yet. Use “Generate scorecards” to create
          this week’s.
        </div>
      ) : (
        <DataTable
          columns={buildScorecardColumns(s.nameOf)}
          data={s.rows}
          isLoading={s.isLoading}
          isError={s.isError}
          error={s.error}
        />
      )}

      <ConfirmDialog
        open={generate.confirmOpen}
        title="Generate Scorecards"
        description="Generate scorecards for your assigned VAs for the current week. This may take a moment."
        onConfirm={generate.confirm}
        onCancel={() => generate.setConfirmOpen(false)}
      />
    </>
  );
}
