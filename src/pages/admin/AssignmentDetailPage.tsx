import { DatePickerField } from '@/components/ui/date-picker-field';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  ClockIcon,
  GaugeIcon,
  HeartIcon,
  MailIcon,
  ShieldCheckIcon,
  StarIcon,
  UserIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAtsClientsQuery,
  useAtsVAsQuery,
  useEodSubmissionsQuery,
  usePerformanceReviewsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { formatMinutes } from '@/lib/time';
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
  completed:
    'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  in_progress:
    'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  pending: 'bg-muted text-muted-foreground border-border',
};

const HEALTH_COLORS: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
};

function fmtDate(iso: string | undefined | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
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
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary whitespace-nowrap">
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
      header: 'Time Spent',
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
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
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
  const { data: atsClients = [] } = useAtsClientsQuery();
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
    assignment ? { vaId: assignment.candidateId } : undefined
  );

  // Derive names
  const vaMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const v of atsVAs) m[v.id] = `${v.firstName} ${v.lastName}`;
    return m;
  }, [atsVAs]);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of atsClients) m[c.id] = c.companyName;
    return m;
  }, [atsClients]);

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
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" asChild className="size-8">
              <Link to={`${rolePrefix}/assignments`}>
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {vaMap[assignment.candidateId] ?? 'VA'} —{' '}
                {clientMap[assignment.clientId] ?? 'Client'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Assignment detail · {assignment.serviceType ?? 'VA Service'}
              </p>
            </div>
          </div>

          {/* Overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Assignment Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-1.5">
                  <BriefcaseIcon className="size-3.5" />
                  Status
                </CardDescription>
                <CardTitle className="text-lg">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      assignment.status === 'active'
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                        : assignment.status === 'on_hold'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'bg-red-500/10 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {assignment.status.replace('_', ' ')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div className="flex gap-2">
                  <CalendarIcon className="size-3.5 mt-0.5 shrink-0" />
                  <span>
                    Started {fmtDate(assignment.startDate)}
                    {assignment.endDate
                      ? ` · Ends ${fmtDate(assignment.endDate)}`
                      : ''}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* VA Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-1.5">
                  <UserIcon className="size-3.5" />
                  VA
                </CardDescription>
                <CardTitle className="text-lg">
                  {vaMap[assignment.candidateId] ?? 'Unknown'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                {vaEmail && (
                  <div className="flex gap-2">
                    <MailIcon className="size-3.5 mt-0.5 shrink-0" />
                    <span>{vaEmail}</span>
                  </div>
                )}
                {vaProfile && (
                  <div className="flex gap-2">
                    <GaugeIcon className="size-3.5 mt-0.5 shrink-0" />
                    <span>
                      Workload:{' '}
                      <span className="font-medium text-foreground">
                        {vaProfile.workloadLevel}
                      </span>
                      {vaProfile.satisfactionScore && (
                        <>
                          {' · '}
                          <StarIcon className="size-3 inline text-amber-500 fill-amber-500" />{' '}
                          {vaProfile.satisfactionScore}/5
                        </>
                      )}
                    </span>
                  </div>
                )}
                {vaProfile?.burnoutRiskFlag && (
                  <div className="flex gap-2 text-amber-600 dark:text-amber-400">
                    <ShieldCheckIcon className="size-3.5 mt-0.5 shrink-0" />
                    <span>Burnout risk flagged</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-1.5">
                  <BuildingIcon className="size-3.5" />
                  Client
                </CardDescription>
                <CardTitle className="text-lg">
                  {clientMap[assignment.clientId] ?? 'Unknown'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                {clientAccount && (
                  <>
                    <div className="flex gap-2">
                      <HeartIcon className="size-3.5 mt-0.5 shrink-0" />
                      <span className="flex items-center gap-1.5">
                        Health:
                        <span
                          className={`inline-block size-2 rounded-full ${HEALTH_COLORS[clientAccount.healthStatus] ?? 'bg-muted'}`}
                        />
                        <span className="font-medium text-foreground">
                          {clientAccount.healthStatus}
                        </span>
                      </span>
                    </div>
                    {clientAccount.satisfactionScore && (
                      <div className="flex gap-2">
                        <StarIcon className="size-3.5 mt-0.5 shrink-0 text-amber-500 fill-amber-500" />
                        <span>
                          Satisfaction:{' '}
                          <span className="font-medium text-foreground">
                            {clientAccount.satisfactionScore}/5
                          </span>
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-1.5">
                  <ClockIcon className="size-3.5" />
                  This Week
                </CardDescription>
                <CardTitle className="text-lg">
                  {(() => {
                    const weekStart = new Date();
                    weekStart.setDate(
                      weekStart.getDate() - ((weekStart.getDay() + 6) % 7)
                    );
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEntries = allEntries.filter(
                      e =>
                        e.assignmentId === id &&
                        e.entryDate >= weekStart.toISOString().split('T')[0]
                    );
                    const hours =
                      weekEntries.reduce((s, e) => s + e.timeSpent, 0) / 60;
                    return (
                      <span>
                        {hours.toFixed(1)}h · {weekEntries.length} entries
                      </span>
                    );
                  })()}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div className="flex gap-2">
                  <CalendarIcon className="size-3.5 mt-0.5 shrink-0" />
                  <span>
                    {filteredEods.length} EODs · {reviews.length} reviews
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Date filters for work entries / EODs */}
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
                <DataTable
                  columns={workColumns}
                  data={filteredEntries}
                  emptyMessage="No work entries found for this assignment"
                />
              )}
            </TabsContent>

            <TabsContent value="eod">
              {loadingEods ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <DataTable
                  columns={eodColumns}
                  data={filteredEods}
                  emptyMessage="No EOD reports found for this assignment"
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
