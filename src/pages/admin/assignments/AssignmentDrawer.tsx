import type { ColumnDef } from '@tanstack/react-table';
import { MailIcon, PenLineIcon, XIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
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
import {
  dateKeyToLocalDate,
  formatMinutes,
  todayString,
  weekStartOfDateKey,
} from '@/lib/time';
import { getAssignment } from '@/services/assignments.service';
import { getClientAccount } from '@/services/client-accounts.service';
import { getVaProfile } from '@/services/va-profiles.service';
import type { IAssignment } from '@/types/assignment';
import type { IEodSubmission } from '@/types/eod-submission';
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Avatar,
  HealthBadge,
  Score,
  WorkloadBadge,
} from '../accounts/badges';
import { shortDate } from '../work-entries/format';
import { StatusPill } from '../work-entries/StatusPill';
import { AssignmentStatus } from './AssignmentStatus';

// Underline tabs: a flat bar with a line under the active tab.
const TAB_LIST =
  'h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0';
const TAB =
  '-mb-px gap-2 rounded-none border-b-2 border-transparent px-0 pt-1 pb-3 text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground';

function fmtDate(iso: string | undefined | null) {
  const date = iso ? dateKeyToLocalDate(iso) : null;
  if (!date) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Table columns ────────────────────────────────────────────────────────────

function buildWorkColumns(): ColumnDef<IWorkEntry>[] {
  return [
    {
      accessorKey: 'entryDate',
      header: 'Date',
      size: 120,
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="text-sm">{shortDate(row.original.entryDate)}</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {row.original.entryTime}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'taskDescription',
      header: () => <span className="normal-case">Task</span>,
      enableSorting: false,
      meta: { fill: true, thClassName: 'min-w-[12rem]', cellClassName: 'min-w-[12rem]' },
      cell: ({ row }) => (
        <div>
          <p className="text-sm leading-snug">{row.original.taskDescription}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {row.original.taskCategory}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'timeSpent',
      header: 'Time',
      size: 80,
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums whitespace-nowrap">
          {formatMinutes(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ getValue }) => <StatusPill status={getValue<WorkEntryStatus>()} />,
    },
  ];
}

function buildEodColumns(): ColumnDef<IEodSubmission>[] {
  return [
    {
      accessorKey: 'date',
      header: 'Date',
      size: 120,
      cell: ({ getValue }) => (
        <span className="text-sm whitespace-nowrap">
          {shortDate(getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: 'hoursWorked',
      header: 'Hours',
      size: 110,
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="text-sm tabular-nums">{row.original.hoursWorked}h</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {row.original.shiftStart} – {row.original.shiftEnd}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'summaryOfWork',
      header: () => <span className="normal-case">Summary</span>,
      enableSorting: false,
      meta: { fill: true, thClassName: 'min-w-[12rem]', cellClassName: 'min-w-[12rem]' },
      cell: ({ row }) => {
        const entries = row.original.workEntries;
        const text =
          entries && entries.length > 0
            ? entries
                .map(e => `${e.task}${e.quantity ? ` ×${e.quantity}` : ''}`)
                .join(' · ')
            : row.original.summaryOfWork || '—';
        const pending = row.original.pendingTasks?.trim();
        return (
          <div>
            <p className="text-sm leading-snug">{text}</p>
            {pending && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pending: {pending}
              </p>
            )}
          </div>
        );
      },
    },
  ];
}

// ─── Small pieces ─────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Party({
  label,
  name,
  email,
  children,
}: {
  label: string;
  name: string;
  email?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold leading-tight">{name}</p>
      {email && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MailIcon className="size-3 shrink-0" />
          <span className="truncate">{email}</span>
        </p>
      )}
      {children}
    </div>
  );
}

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <span>{label}</span>
    {children}
  </div>
);

// ─── Drawer ───────────────────────────────────────────────────────────────────

/**
 * An assignment opened in a floating drawer over the list. The detail only
 * mounts while one is open, so its filters and tab start fresh each time.
 */
export function AssignmentDrawer({
  assignmentId,
  canManage,
  onEdit,
  onClose,
}: {
  assignmentId: string | null;
  canManage: boolean;
  onEdit: (a: IAssignment) => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!assignmentId} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="right"
        // Floats with a gap to the viewport; the built-in close button is
        // hidden in favour of the one below, outside the drawer's top-left.
        className="flex w-[calc(100vw-2rem)] flex-col gap-0 overflow-visible border-white/[0.14] bg-surface-raised p-0 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9)] sm:max-w-3xl [&>button:last-child]:hidden"
      >
        <SheetTitle className="sr-only">Assignment details</SheetTitle>
        <SheetDescription className="sr-only">
          The VA, client, activity and reports for this assignment.
        </SheetDescription>
        <SheetClose asChild>
          <Button
            size="icon"
            variant="outline"
            aria-label="Close"
            className="absolute right-3 top-3 z-10 size-8 rounded-md border-white/[0.14] bg-surface-raised min-[800px]:-left-11 min-[800px]:right-auto min-[800px]:top-0"
          >
            <XIcon className="size-4" />
          </Button>
        </SheetClose>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
          {assignmentId && (
            <AssignmentDetail
              key={assignmentId}
              id={assignmentId}
              canManage={canManage}
              onEdit={onEdit}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AssignmentDetail({
  id,
  onEdit,
  canManage,
}: {
  id: string;
  onEdit?: (a: IAssignment) => void;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();

  const { data: assignmentData, isLoading: loadingAssignment } = useQuery({
    queryKey: ['assignments', 'detail', id],
    queryFn: () => getAssignment(id),
    // The list already holds this assignment, so show it straight away.
    placeholderData: () =>
      queryClient
        .getQueriesData<IAssignment[]>({ queryKey: ['assignments'] })
        .flatMap(([, rows]) => (Array.isArray(rows) ? rows : []))
        .find(r => r._id === id),
  });

  const assignment = assignmentData ?? null;

  const { data: atsVAs = [] } = useAtsVAsQuery();
  const { data: crmClients = [] } = useProvisionedClientsQuery();
  const { data: accountManagers = [] } = useActiveAccountManagersQuery();
  // Only this assignment's rows, filtered by the server.
  const { data: allEntries = [], isLoading: loadingEntries } =
    useWorkEntriesQuery({ assignmentId: id });
  const { data: allEods = [], isLoading: loadingEods } = useEodSubmissionsQuery(
    { assignmentId: id }
  );

  const { data: clientAccount = null } = useQuery({
    queryKey: ['client-account', assignment?.clientId],
    queryFn: () => getClientAccount(assignment!.clientId),
    enabled: !!assignment,
  });

  const { data: vaProfile = null } = useQuery({
    queryKey: ['va-profile', assignment?.candidateId],
    queryFn: () => getVaProfile(assignment!.candidateId),
    enabled: !!assignment,
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

  const vaEmail = useMemo(() => {
    const va = atsVAs.find(v => v.id === assignment?.candidateId);
    return va?.email ?? null;
  }, [atsVAs, assignment]);

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
      <div className="flex flex-1 items-center justify-center p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Assignment not found</p>
      </div>
    );
  }

  const vaName = vaMap[assignment.candidateId] ?? 'VA';
  const clientName = clientMap[assignment.clientId] ?? 'Client';
  const am = accountManagers.find(u => u.id === assignment.accountManagerId);

  const weekStart = weekStartOfDateKey(todayString());
  const weekEntries = allEntries.filter(
    e => e.assignmentId === id && e.entryDate >= weekStart
  );
  const weekHours = weekEntries.reduce((s, e) => s + e.timeSpent, 0) / 60;
  const weekEods = filteredEods.filter(e => e.date >= weekStart).length;
  const reviewCount = reviews.filter(
    r => r.clientId === assignment.clientId
  ).length;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border px-6 py-4 pr-14 min-[800px]:pr-6">
        <Avatar name={vaName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold">
              {vaName} — {clientName}
            </h2>
            <AssignmentStatus status={assignment.status} />
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {assignment.serviceType ? `${assignment.serviceType} · ` : ''}
            {fmtDate(assignment.startDate)}
            {assignment.endDate
              ? ` → ${fmtDate(assignment.endDate)}`
              : ' · Ongoing'}
          </p>
        </div>
        {canManage && onEdit && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 shrink-0"
            onClick={() => onEdit(assignment)}
          >
            <PenLineIcon className="size-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-5">
          {/* Who is involved */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 sm:grid-cols-3">
            <Party label="Virtual assistant" name={vaName} email={vaEmail}>
              {vaProfile && (
                <div className="space-y-1.5">
                  <Row label="Workload">
                    <WorkloadBadge value={vaProfile.workloadLevel} />
                  </Row>
                  {vaProfile.satisfactionScore ? (
                    <Row label="Satisfaction">
                      <Score value={vaProfile.satisfactionScore} />
                    </Row>
                  ) : null}
                  {vaProfile.burnoutRiskFlag && (
                    <p className="text-xs text-status-warning">
                      Burnout risk flagged
                    </p>
                  )}
                </div>
              )}
            </Party>
            <Party
              label="Account manager"
              name={am ? `${am.firstName} ${am.lastName}` : '—'}
              email={am?.email}
            />
            <Party label="Client" name={clientName}>
              {clientAccount && (
                <div className="space-y-1.5">
                  <Row label="Health">
                    <HealthBadge value={clientAccount.healthStatus} />
                  </Row>
                  {clientAccount.satisfactionScore ? (
                    <Row label="Satisfaction">
                      <Score value={clientAccount.satisfactionScore} />
                    </Row>
                  ) : null}
                </div>
              )}
            </Party>
          </div>

          {/* This week */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Hours this week" value={`${weekHours.toFixed(1)}h`} />
            <Stat label="Entries this week" value={weekEntries.length} />
            <Stat label="EODs this week" value={weekEods} />
            <Stat label="Reviews" value={reviewCount} />
          </div>

          {assignment.notes && (
            <div className="space-y-1.5 border-t border-border pt-5">
              <h3 className="text-sm font-semibold">Notes</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {assignment.notes}
              </p>
            </div>
          )}

          {/* Activity */}
          <Tabs defaultValue="work" className="border-t border-border pt-5">
            <TabsList className={TAB_LIST}>
              <TabsTrigger value="work" className={TAB}>
                Work entries
                <span className="text-xs font-normal tabular-nums text-muted-foreground">
                  {filteredEntries.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="eod" className={TAB}>
                EOD reports
                <span className="text-xs font-normal tabular-nums text-muted-foreground">
                  {filteredEods.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <div className="my-4 flex flex-wrap items-center gap-1.5">
              <div className="w-48">
                <DatePickerField value={dateFrom} onChange={setDateFrom} />
              </div>
              <span className="text-xs text-muted-foreground">to</span>
              <div className="w-48">
                <DatePickerField value={dateTo} onChange={setDateTo} />
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-1 inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <XIcon className="size-3.5" />
                  Clear
                </button>
              )}
            </div>

            <TabsContent value="work" className="mt-0">
              {loadingEntries ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <DataTable columns={workColumns} data={filteredEntries} />
              )}
            </TabsContent>

            <TabsContent value="eod" className="mt-0">
              {loadingEods ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <DataTable columns={eodColumns} data={filteredEods} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
