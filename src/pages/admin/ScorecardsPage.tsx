import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import {
  ClearFiltersButton,
  SearchInput,
} from '@/components/shared/FilterControls';
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
import { useGenerateScorecards } from '@/hooks/mutations';
import { useAllAssignmentsQuery, useScorecardsQuery } from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { useVaNames } from '@/hooks/use-name-maps';
import type { IScorecard } from '@/types/scorecard';
import type { ColumnDef } from '@tanstack/react-table';
import { RefreshCwIcon, StarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { initialsOf } from '@/lib/format';
import { formatDateKeyShort } from '@/lib/time';

// Three clear levels, colour on the text only (no coloured fills).
const scoreColor = (score: number) => {
  if (score >= 80) return 'text-status-success';
  if (score >= 60) return 'text-status-warning';
  return 'text-status-error';
};

export default function ScorecardsPage() {
  const user = useAppSelector(s => s.auth.user);
  const isAccountManager = user?.role === 'account_manager';

  // AM scoping: only see scorecards for their own assignments' VAs
  const { data: amAssignments = [] } = useAllAssignmentsQuery(
    isAccountManager ? user?.id : undefined
  );
  const amCandidateIds = useMemo(
    () => new Set(amAssignments.map(a => a.candidateId).filter(Boolean)),
    [amAssignments]
  );

  const [search, setSearch] = useState('');
  // null = follow the latest week; 'all' = every week.
  const [weekChoice, setWeekChoice] = useState<string | null>(null);
  const generate = useGenerateScorecards();
  const generating = generate.isPending;
  const generateError = generate.error;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: allScorecards = [], isLoading } = useScorecardsQuery();

  // For AM, client-side filter by their assignments' candidateIds
  const scopedScorecards = useMemo(() => {
    if (!isAccountManager) return allScorecards;
    return allScorecards.filter(s => amCandidateIds.has(s.vaId));
  }, [allScorecards, isAccountManager, amCandidateIds]);

  const vaMap = useVaNames();

  const nameOf = (s: IScorecard) => s.vaName || vaMap[s.vaId] || 'Unknown VA';

  // Distinct weeks, newest first, keyed by their start date.
  const weeks = useMemo(() => {
    const map = new Map<string, IScorecard>();
    for (const s of scopedScorecards) {
      const key = s.weekStart?.slice(0, 10);
      if (key && !map.has(key)) map.set(key, s);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [scopedScorecards]);
  const week = weekChoice ?? weeks[0]?.[0] ?? 'all';

  const query = search.trim().toLowerCase();
  const scorecards = scopedScorecards.filter(s => {
    if (week !== 'all' && s.weekStart?.slice(0, 10) !== week) return false;
    if (!query) return true;
    return `${nameOf(s)} ${s.companyName ?? ''}`.toLowerCase().includes(query);
  });

  async function handleGenerate() {
    setConfirmOpen(false);
    await generate.run();
  }

  const columns: ColumnDef<IScorecard>[] = [
    {
      id: 'va',
      header: 'VA',
      meta: { fill: true, cellClassName: 'max-w-0' },
      accessorFn: s => nameOf(s),
      cell: ({ row }) => {
        const name = nameOf(row.original);
        const initials = initialsOf(name);
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
              {initials || '?'}
            </div>
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

  return (
    <Page>
      <PageSection>
        <PageHeader
          title="Productivity Scorecards"
          description={
            isAccountManager
              ? 'Weekly scores for your assigned VAs'
              : 'Weekly performance scores'
          }
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmOpen(true)}
              disabled={generating}
            >
              <RefreshCwIcon
                className={`size-3.5 ${generating ? 'animate-spin' : ''}`}
              />
              {generating ? 'Generating…' : 'Generate scorecards'}
            </Button>
          }
        />

        {/* Search + count */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search VA or company…"
            label="Search by VA or company"
          />
          <Select value={week} onValueChange={setWeekChoice}>
            <SelectTrigger
              className="h-8 w-48 text-sm"
              aria-label="Filter by week"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All weeks</SelectItem>
              {weeks.map(([key, sc], i) => (
                <SelectItem key={key} value={key}>
                  {formatDateKeyShort(sc.weekStart)} –{' '}
                  {formatDateKeyShort(sc.weekEnd)}
                  {i === 0 && ' (latest)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {search && <ClearFiltersButton onClick={() => setSearch('')} />}
          {generateError && (
            <p className="text-xs text-destructive">{generateError}</p>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {scorecards.length} scorecard{scorecards.length !== 1 ? 's' : ''}
          </span>
        </div>

        <DataTable columns={columns} data={scorecards} isLoading={isLoading} />

        <ConfirmDialog
          open={confirmOpen}
          title="Generate Scorecards"
          description={
            isAccountManager
              ? 'Generate scorecards for your assigned VAs for the current week. This may take a moment.'
              : 'Generate scorecards for ALL VAs for the current week. This may take a moment.'
          }
          onConfirm={handleGenerate}
          onCancel={() => setConfirmOpen(false)}
        />
      </PageSection>
    </Page>
  );
}
