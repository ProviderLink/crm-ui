import { DatePickerField } from '@/components/ui/date-picker-field';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  ClockIcon,
  GaugeIcon,
  HeartIcon,
  MailIcon,
  StarIcon,
  StickyNoteIcon,
  UserIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useActiveAccountManagersQuery,
  useAtsVAsQuery,
  useEodSubmissionsQuery,
  usePerformanceReviewsQuery,
  useProvisionedClientsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { dateKeyToLocalDate, formatMinutes, todayString, weekStartOfDateKey } from '@/lib/time';
import { getAllAssignments } from '@/services/assignments.service';
import { getClientAccounts } from '@/services/client-accounts.service';
import { getVaProfiles } from '@/services/va-profiles.service';
import type { IClientAccount } from '@/types/client-account';
import type { IEodSubmission } from '@/types/eod-submission';
import type { IVaProfile } from '@/types/va-profile';
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry';
import { useQuery } from '@tanstack/react-query';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<WorkEntryStatus, string> = {
  completed: 'bg-white/[0.04] text-text-secondary border-[rgba(255,255,255,0.08)]',
  in_progress: 'bg-white/[0.04] text-text-secondary border-[rgba(255,255,255,0.08)]',
  pending: 'bg-white/[0.04] text-text-tertiary border-[rgba(255,255,255,0.08)]',
};

const HEALTH_COLORS: Record<string, string> = {
  green: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  red: 'bg-red-500/10 text-red-400 ring-red-500/20',
};

const WORKLOAD_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  normal: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  high: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  overloaded: 'bg-red-500/10 text-red-400 ring-red-500/20',
};

const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  on_hold: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  ended: 'bg-white/[0.04] text-text-secondary ring-white/[0.08]',
};

function fmtDate(iso: string | undefined | null) {
  const date = iso ? dateKeyToLocalDate(iso) : null;
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Work Entry columns ────────────────────────────────────────────────────────

function buildWorkColumns(): ColumnDef<IWorkEntry>[] {
  return [
    {
      accessorKey: 'entryDate',
      header: 'Date',
      size: 105,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {getValue<string>()?.slice(0, 10)}
        </span>
      ),
    },
    {
      accessorKey: 'entryTime',
      header: 'Time',
      size: 75,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'taskCategory',
      header: 'Category',
      size: 160,
      cell: ({ getValue }) => (
        <span className="text-xs px-2 py-0.5 rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] bg-white/[0.04] text-text-secondary whitespace-nowrap">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'taskDescription',
      header: 'Description',
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'timeSpent',
      header: () => <span className="whitespace-nowrap">Time Spent</span>,
      size: 95,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {formatMinutes(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 125,
      cell: ({ getValue }) => {
        const s = getValue<WorkEntryStatus>();
        return (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLES[s]}`}
          >
            {s.replace('_', ' ')}
          </span>
        );
      },
    },
  ];
}

// ─── EOD columns ───────────────────────────────────────────────────────────────

function buildEodColumns(): ColumnDef<IEodSubmission>[] {
  return [
    {
      accessorKey: 'date',
      header: 'Date',
      size: 105,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {getValue<string>()?.slice(0, 10)}
        </span>
      ),
    },
    {
      accessorKey: 'shiftStart',
      header: 'Start',
      size: 70,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'shiftEnd',
      header: 'End',
      size: 70,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'hoursWorked',
      header: 'Hours',
      size: 75,
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-foreground">
          {getValue<number>()}h
        </span>
      ),
    },
    {
      accessorKey: 'summaryOfWork',
      header: 'Summary',
      enableSorting: false,
      cell: ({ row }) => {
        const entries = row.original.workEntries;
        if (entries && entries.length > 0) {
          return (
            <span className="text-sm">
              {entries
                .map(e => `${e.task}${e.quantity ? ` ×${e.quantity}` : ''}`)
                .join(' · ')}
            </span>
          );
        }
        return (
          <span className="text-sm">{row.original.summaryOfWork || '—'}</span>
        );
      },
    },
    {
      accessorKey: 'pendingTasks',
      header: 'Pending Tasks',
      size: 200,
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAppSelector(s => s.auth.user);
  const rolePrefix = user?.role === 'admin' ? '/admin' : '/am';

  const { data: assignments = [], isLoading: loadingAssignment } = useQuery({
    queryKey: ['assignments', 'detail', id],
    queryFn: () => getAllAssignments(),
  });

  const assignment = assignments.find(a => a._id === id) ?? null;

  const { data: atsVAs = [] } = useAtsVAsQuery();
  const { data: crmClients = [] } = useProvisionedClientsQuery();
  const { data: accountManagers = [] } = useActiveAccountManagersQuery();
  const { data: allEntries = [], isLoading: loadingEntries } =
    useWorkEntriesQuery();
  const { data: allEods = [], isLoading: loadingEods } =
    useEodSubmissionsQuery();

  const { data: clientAccounts = [] } = useQuery({
    queryKey: ['client-accounts'],
    queryFn: () => getClientAccounts(),
  });

  const { data: vaProfiles = [] } = useQuery({
    queryKey: ['va-profiles'],
    queryFn: () => getVaProfiles(),
  });

  const { data: reviews = [] } = usePerformanceReviewsQuery(
    assignment ? { candidateId: assignment.candidateId } : undefined
  );

  // Derive names
  const vaMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const v of atsVAs) m[v.id] = `${v.firstName} ${v.lastName}`;
    return m;
  }, [atsVAs]);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of crmClients) m[c.clientId] = c.companyName;
    return m;
  }, [crmClients]);

  const amMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of accountManagers) m[u.id] = `${u.firstName} ${u.lastName}`;
    return m;
  }, [accountManagers]);

  const vaEmail = useMemo(() => {
    const va = atsVAs.find(v => v.id === assignment?.candidateId);
    return va?.email ?? null;
  }, [atsVAs, assignment]);

  const clientAccount = useMemo(() => {
    return (
      clientAccounts.find(
        (ca: IClientAccount) => ca.clientId === assignment?.clientId
      ) ?? null
    );
  }, [clientAccounts, assignment]);

  const vaProfile = useMemo(() => {
    return (
      vaProfiles.find(
        (vp: IVaProfile) => vp.vaId === assignment?.candidateId
      ) ?? null
    );
  }, [vaProfiles, assignment]);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredEntries = useMemo(() => {
    return allEntries.filter(e => {
      if (e.assignmentId !== id) return false;
      if (dateFrom && e.entryDate < dateFrom) return false;
      if (dateTo && e.entryDate > dateTo) return false;
      return true;
    });
  }, [allEntries, id, dateFrom, dateTo]);

  const filteredEods = useMemo(() => {
    return allEods.filter(e => {
      if (e.assignmentId !== id) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      return true;
    });
  }, [allEods, id, dateFrom, dateTo]);

  const workColumns = useMemo(() => buildWorkColumns(), []);
  const eodColumns = useMemo(() => buildEodColumns(), []);

  function clearFilters() {
    setDateFrom('');
    setDateTo('');
  }

  const hasActiveFilters = dateFrom !== '' || dateTo !== '';

  if (loadingAssignment) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Skeleton className="h-64 w-full max-w-3xl" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-lg font-medium text-muted-foreground">
          Assignment not found
        </p>
        <Button variant="outline" asChild>
          <Link to={`${rolePrefix}/assignments`}>Back to Assignments</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Header */}
        <div className="px-4 lg:px-6">
          <div className="flex items-start gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon" aria-label="Back to assignments"
              asChild
              className="size-8 mt-0.5 shrink-0"
            >
              <Link to={`${rolePrefix}/assignments`}>
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-foreground">
                {vaMap[assignment.candidateId] ?? 'VA'} —{' '}
                {clientMap[assignment.clientId] ?? 'Client'}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* Assignment ID */}
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">ID</span>
                  <span className="font-mono text-sm text-muted-foreground">
                    {id?.slice(-8)}
                  </span>
                </span>

                <span className="text-muted-foreground/30 text-xs">·</span>

                {/* Status badge */}
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] ring-1 ring-inset ${ASSIGNMENT_STATUS_COLORS[assignment.status] ?? 'bg-white/[0.04] text-text-secondary ring-white/[0.08]'}`}
                >
                  {assignment.status.replace('_', ' ')}
                </span>

                {assignment.serviceType && (
                  <>
                    <span className="text-muted-foreground/30 text-xs">·</span>
                    <span className="text-sm text-muted-foreground">
                      {assignment.serviceType}
                    </span>
                  </>
                )}

                <span className="text-muted-foreground/30 text-xs">·</span>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="size-3.5" />
                  {fmtDate(assignment.startDate)}
                  {assignment.endDate
                    ? ` → ${fmtDate(assignment.endDate)}`
                    : ' · Ongoing'}
                </span>
              </div>
            </div>
          </div>

          {/* Overview cards — accounts-page detail sheet style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {/* VA Card */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <UserIcon className="size-3.5" />
                Virtual Assistant
              </p>
              <p className="text-base font-semibold text-foreground leading-tight">
                {vaMap[assignment.candidateId] ?? 'Unknown'}
              </p>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {vaEmail && (
                  <div className="flex items-center gap-2">
                    <MailIcon className="size-3.5 shrink-0" />
                    <span className="truncate text-xs">{vaEmail}</span>
                  </div>
                )}
                {vaProfile && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <GaugeIcon className="size-3.5 shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        Workload:
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset ${WORKLOAD_COLORS[vaProfile.workloadLevel] ?? 'bg-white/[0.04] text-text-secondary ring-white/[0.08]'}`}
                      >
                        {vaProfile.workloadLevel}
                      </span>
                    </div>
                    {vaProfile.satisfactionScore && (
                      <div className="flex items-center gap-2">
                        <StarIcon className="size-3.5 shrink-0 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-muted-foreground">
                          VA Satisfaction:
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {vaProfile.satisfactionScore}/5
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {vaProfile?.burnoutRiskFlag && (
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <AlertTriangleIcon className="size-3.5 shrink-0" />
                    <span className="text-xs">Burnout risk flagged</span>
                  </div>
                )}
              </div>
            </div>

            {/* Account Manager Card */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <BriefcaseIcon className="size-3.5" />
                Account Manager
              </p>
              <p className="text-base font-semibold text-foreground leading-tight">
                {assignment.accountManagerId ? (
                  (amMap[assignment.accountManagerId] ?? 'Unknown')
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {assignment.accountManagerId &&
                  (() => {
                    const am = accountManagers.find(
                      u => u.id === assignment.accountManagerId
                    );
                    return am?.email ? (
                      <div className="flex items-center gap-2">
                        <MailIcon className="size-3.5 shrink-0" />
                        <span className="truncate text-xs">{am.email}</span>
                      </div>
                    ) : null;
                  })()}
              </div>
            </div>

            {/* Client Card */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <BuildingIcon className="size-3.5" />
                Client
              </p>
              <p className="text-base font-semibold text-foreground leading-tight">
                {clientMap[assignment.clientId] ?? 'Unknown'}
              </p>
              <div className="space-y-1.5">
                {clientAccount && (
                  <>
                    <div className="flex items-center gap-2">
                      <HeartIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Client Health:
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize ring-1 ring-inset ${HEALTH_COLORS[clientAccount.healthStatus] ?? 'bg-white/[0.04] text-text-secondary ring-white/[0.08]'}`}
                      >
                        {clientAccount.healthStatus}
                      </span>
                    </div>
                    {clientAccount.satisfactionScore && (
                      <div className="flex items-center gap-2">
                        <StarIcon className="size-3.5 shrink-0 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-muted-foreground">
                          Client Satisfaction:
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {clientAccount.satisfactionScore}/5
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Activity / This Week Card */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <ClockIcon className="size-3.5" />
                This Week
              </p>
              {(() => {
                const weekStart = weekStartOfDateKey(todayString());
                const weekEntries = allEntries.filter(
                  e => e.assignmentId === id && e.entryDate >= weekStart
                );
                const hours =
                  weekEntries.reduce((s, e) => s + e.timeSpent, 0) / 60;
                return (
                  <>
                    <p className="text-2xl font-bold text-foreground leading-none">
                      {hours.toFixed(1)}
                      <span className="text-base font-medium text-muted-foreground ml-0.5">
                        h
                      </span>
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        { label: 'Entries', value: weekEntries.length },
                        { label: 'EODs', value: filteredEods.length },
                        { label: 'Reviews', value: reviews.length },
                      ].map(stat => (
                        <div key={stat.label} className="text-center">
                          <p className="text-sm font-semibold text-foreground">
                            {stat.value}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Notes */}
          {assignment.notes && (
            <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 mb-5">
              <StickyNoteIcon className="size-3.5 mt-[3px] shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {assignment.notes}
              </p>
            </div>
          )}

          {/* Date filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From</span>
              <DatePickerField
                value={dateFrom}
                onChange={v => setDateFrom(v)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To</span>
              <DatePickerField value={dateTo} onChange={v => setDateTo(v)} />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="work">
            <TabsList className="mb-4">
              <TabsTrigger value="work">
                Work Entries{' '}
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {filteredEntries.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="eod">
                EOD Reports{' '}
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {filteredEods.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="work">
              {loadingEntries ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <DataTable columns={workColumns} data={filteredEntries} />
              )}
            </TabsContent>

            <TabsContent value="eod">
              {loadingEods ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <DataTable columns={eodColumns} data={filteredEods} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
