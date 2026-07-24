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
import { BarChart3Icon, RefreshCwIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-[#A0A0A0]';
  if (score >= 60) return 'text-[#A0A0A0]';
  return 'text-[#F87171]';
};

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

  const [vaFilter, setVaFilter] = useState<string>('all');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const vaId = vaFilter === 'all' ? undefined : vaFilter;
  const { data: allScorecards = [], isLoading } = useScorecardsQuery(vaId);
  const { data: crmVAs = [] } = useCrmVaUsersQuery();
  const { data: atsVAs = [] } = useAtsVAsQuery();

  // For AM, client-side filter by their assignments' candidateIds
  const scorecards = useMemo(() => {
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

  async function handleGenerate() {
    setGenerateError(null);
    setConfirmOpen(false);
    setGenerating(true);
    try {
      await generateScorecards(vaId);
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
    } catch {
      setGenerateError('Failed to generate scorecards. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  const columns: ColumnDef<IScorecard>[] = [
    {
      accessorKey: 'vaId',
      header: 'VA',
      size: 155,
      cell: ({ row, getValue }) => (
        <span className="text-sm font-medium">
          {row.original.vaName || vaMap[getValue<string>()] || 'Unknown VA'}
        </span>
      ),
    },
    {
      accessorKey: 'weekStart',
      header: 'Week',
      size: 210,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {row.original.weekStart?.slice(0, 10)} –{' '}
          {row.original.weekEnd?.slice(0, 10)}
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
      header: 'EOD Rate',
      size: 95,
      cell: ({ getValue }) => {
        const v = getValue<number>();
        return (
          <span className={`text-sm tabular-nums font-medium ${scoreColor(v)}`}>
            {v.toFixed(0)}%
          </span>
        );
      },
    },
    {
      accessorKey: 'productivityScore',
      header: 'Score',
      size: 80,
      cell: ({ getValue }) => {
        const s = getValue<number>();
        const colorClass =
          s >= 80
            ? 'bg-white/[0.04] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]'
            : s >= 60
              ? 'bg-white/[0.04] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]'
              : 'bg-white/[0.04] text-[#F87171] border-[rgba(255,255,255,0.08)]';
        return (
          <span
            className={`font-mono text-[10px] font-medium tabular-nums px-2 py-0.5 rounded border whitespace-nowrap ${colorClass}`}
          >
            {s.toFixed(0)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Productivity Scorecards
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isAccountManager
                  ? 'Weekly scores for your assigned VAs — generated every Sunday at 11 PM'
                  : 'Weekly performance scores — generated every Sunday at 11 PM'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3Icon className="size-4" />
              <span className="text-sm">{scorecards.length} records</span>
            </div>
          </div>

          {/* Filters + actions */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">VA</span>
              <Select value={vaFilter} onValueChange={setVaFilter}>
                <SelectTrigger className="h-8 w-44 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All VAs</SelectItem>
                  {atsVAs.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.firstName} {v.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {vaFilter !== 'all' && (
              <button
                onClick={() => setVaFilter('all')}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {generateError && (
                <p className="text-xs text-destructive">{generateError}</p>
              )}
              {!isAccountManager && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="border border-white/10 hover:border-white/20 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                  onClick={() => setConfirmOpen(true)}
                  disabled={generating}
                >
                  <RefreshCwIcon
                    className={`size-3.5 ${generating ? 'animate-spin' : ''}`}
                  />
                  {generating ? 'Generating…' : 'Generate Now'}
                </Button>
              )}
            </div>
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
              vaId
                ? 'Generate a new scorecard for this VA for the current week.'
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
