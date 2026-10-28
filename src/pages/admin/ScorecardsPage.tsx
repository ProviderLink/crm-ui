import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAllAssignmentsQuery,
  useAtsVAsQuery,
  useCrmVaUsersQuery,
  useScorecardsQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { generateScorecards } from '@/services/scorecards.service';
import type { IScorecard } from '@/types/scorecard';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { RefreshCwIcon, SearchIcon, StarIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

// Three clear levels, colour on the text only (no coloured fills).
const scoreColor = (score: number) => {
  if (score >= 80) return 'text-status-success';
  if (score >= 60) return 'text-status-warning';
  return 'text-status-error';
};

// "2026-10-26" -> "Oct 26", built from parts so the day never shifts by timezone.
function shortDate(iso?: string) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y!, m! - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function ScorecardsPage() {
  const queryClient = useQueryClient();
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
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data: allScorecards = [], isLoading } = useScorecardsQuery();
  const { data: crmVAs = [] } = useCrmVaUsersQuery();
  const { data: atsVAs = [] } = useAtsVAsQuery();

  // For AM, client-side filter by their assignments' candidateIds
  const scopedScorecards = useMemo(() => {
    if (!isAccountManager) return allScorecards;
    return allScorecards.filter(s => amCandidateIds.has(s.vaId));
  }, [allScorecards, isAccountManager, amCandidateIds]);

  // Build VA name map: primary source = ATS candidates (vaId matches ATS _id),
  // fallback = CRM VA users by candidateRef or _id
  const vaMap: Record<string, string> = {};
  for (const v of atsVAs) {
    vaMap[v.id] = `${v.firstName} ${v.lastName}`;
  }
  for (const v of crmVAs) {
    const name = `${v.firstName} ${v.lastName}`;
    if (v.candidateRef && !vaMap[v.candidateRef]) vaMap[v.candidateRef] = name;
    if (v._id && !vaMap[v._id]) vaMap[v._id] = name;
  }

  const nameOf = (s: IScorecard) =>
    s.vaName || vaMap[s.vaId] || 'Unknown VA';

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
    setGenerateError(null);
    setConfirmOpen(false);
    setGenerating(true);
    try {
      await generateScorecards();
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
    } catch {
      setGenerateError('Failed to generate scorecards. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  const columns: ColumnDef<IScorecard>[] = [
    {
      id: 'va',
      header: 'VA',
      meta: { fill: true, cellClassName: 'max-w-0' },
      accessorFn: s => nameOf(s),
      cell: ({ row }) => {
        const name = nameOf(row.original);
        const initials = name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
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
          {shortDate(row.original.weekStart)} –{' '}
          {shortDate(row.original.weekEnd)}
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
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Productivity Scorecards
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isAccountManager
                  ? 'Weekly scores for your assigned VAs'
                  : 'Weekly performance scores'}
              </p>
            </div>
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
          </div>

          {/* Search + count */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search VA or company…"
                aria-label="Search by VA or company"
                className="h-8 pl-8 text-sm"
              />
            </div>
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
                    {shortDate(sc.weekStart)} – {shortDate(sc.weekEnd)}
                    {i === 0 && ' (latest)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <XIcon className="size-3.5" />
                Clear
              </button>
            )}
            {generateError && (
              <p className="text-xs text-destructive">{generateError}</p>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {scorecards.length} scorecard{scorecards.length !== 1 ? 's' : ''}
            </span>
          </div>

          <DataTable
            columns={columns}
            data={scorecards}
            isLoading={isLoading}
          />

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
        </div>
      </div>
    </div>
  );
}
