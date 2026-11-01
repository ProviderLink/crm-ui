import type { ColumnDef } from '@tanstack/react-table';
import { RefreshCwIcon, StarIcon } from 'lucide-react';

import {
  ClearFiltersButton,
  SearchInput,
} from '@/components/shared/FilterControls';
import { StatTile } from '@/components/shared/StatTile';
import { InitialsTile } from '@/components/shared/badges';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { IScorecard } from '@/types/scorecard';

import { formatDateKeyShort } from '@/lib/time';
import { useAmScorecards } from './use-am-scorecards';

// Three clear levels, colour on the text only (no coloured fills).
const scoreColor = (score: number) => {
  if (score >= 80) return 'text-status-success';
  if (score >= 60) return 'text-status-warning';
  return 'text-status-error';
};

export function ScorecardsTab() {
  const s = useAmScorecards();

  const columns: ColumnDef<IScorecard>[] = [
    {
      id: 'va',
      header: 'VA',
      meta: { fill: true, cellClassName: 'max-w-0' },
      accessorFn: r => s.nameOf(r),
      cell: ({ row }) => {
        const name = s.nameOf(row.original);
        return (
          <div className="flex min-w-0 items-center gap-3">
            <InitialsTile name={name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={name}>
                {name}
              </p>
              {row.original.companyName && (
                <p className="truncate text-xs text-muted-foreground">
                  {row.original.companyName}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'weekStart',
      header: 'Week',
      size: 130,
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {formatDateKeyShort(row.original.weekStart)} –{' '}
          {formatDateKeyShort(row.original.weekEnd)}
        </span>
      ),
    },
    {
      accessorKey: 'totalHours',
      header: 'Hours',
      size: 80,
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums">
          {getValue<number>().toFixed(1)}h
        </span>
      ),
    },
    {
      accessorKey: 'totalTasksCompleted',
      header: 'Tasks',
      size: 75,
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'eodComplianceRate',
      header: 'EOD rate',
      size: 120,
      cell: ({ getValue }) => {
        const v = getValue<number>();
        return (
          <span className={`text-sm font-medium tabular-nums ${scoreColor(v)}`}>
            {v.toFixed(0)}%
          </span>
        );
      },
    },
    {
      accessorKey: 'productivityScore',
      header: 'Score',
      size: 90,
      cell: ({ getValue }) => {
        const v = getValue<number>();
        return (
          <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
            <StarIcon
              className={`size-3.5 fill-current ${scoreColor(v)}`}
              aria-hidden
            />
            <span className="font-medium">{v.toFixed(0)}</span>
          </span>
        );
      },
    },
  ];

  const none = s.rows.length === 0;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          value={s.search}
          onChange={s.setSearch}
          placeholder="Search VA or company…"
          label="Search by VA or company"
        />
        <Select value={s.week} onValueChange={s.setWeekChoice}>
          <SelectTrigger
            className="h-8 w-48 text-sm"
            aria-label="Filter by week"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All weeks</SelectItem>
            {s.weeks.map(([key, sc], i) => (
              <SelectItem key={key} value={key}>
                {formatDateKeyShort(sc.weekStart)} –{' '}
                {formatDateKeyShort(sc.weekEnd)}
                {i === 0 && ' (latest)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {s.search && <ClearFiltersButton onClick={() => s.setSearch('')} />}
        {s.generateError && (
          <p className="text-xs text-destructive">{s.generateError}</p>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {s.rows.length} scorecard{s.rows.length !== 1 ? 's' : ''}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => s.setConfirmOpen(true)}
          disabled={s.generating}
        >
          <RefreshCwIcon
            className={`size-3.5 ${s.generating ? 'animate-spin' : ''}`}
          />
          {s.generating ? 'Generating…' : 'Generate scorecards'}
        </Button>
      </div>

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

      {!s.isLoading && none && !s.search ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No scorecards for this period yet. Use “Generate scorecards” to create
          this week’s.
        </div>
      ) : (
        <DataTable columns={columns} data={s.rows} isLoading={s.isLoading} />
      )}

      <ConfirmDialog
        open={s.confirmOpen}
        title="Generate Scorecards"
        description="Generate scorecards for your assigned VAs for the current week. This may take a moment."
        onConfirm={s.handleGenerate}
        onCancel={() => s.setConfirmOpen(false)}
      />
    </>
  );
}
