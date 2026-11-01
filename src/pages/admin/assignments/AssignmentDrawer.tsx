import { PenLineIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DetailDrawer, DrawerHeader } from '@/components/shared/DetailDrawer';
import { ClearFiltersButton } from '@/components/shared/FilterControls';
import { StatTile } from '@/components/shared/StatTile';
import {
  AssignmentStatusPill,
  HealthBadge,
  InitialsTile,
  Score,
  WorkloadBadge,
} from '@/components/shared/badges';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TabCount,
  UnderlineTab,
  UnderlineTabsList,
} from '@/components/shared/UnderlineTabs';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  useActiveAccountManagersQuery,
  useAssignmentQuery,
  useAtsVAsQuery,
  useClientAccountQuery,
  useEodSubmissionsQuery,
  usePerformanceReviewsQuery,
  useProvisionedClientsQuery,
  useVaProfileQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { formatDate } from '@/lib/format';
import { todayString, weekStartOfDateKey } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

import { buildEodColumns, buildWorkColumns } from './drawer-columns';
import { Party, Row } from './drawer-parts';

// ─── Drawer ───────────────────────────────────────────────────────────────────

/**
 * An assignment opened in a floating drawer over the list. The detail only
 * mounts while one is open, so its filters and tab start fresh each time.
 */
export function AssignmentDrawer({
  assignmentId,
  onEdit,
  onClose,
}: {
  assignmentId: string | null;
  onEdit: (a: IAssignment) => void;
  onClose: () => void;
}) {
  return (
    <DetailDrawer
      open={!!assignmentId}
      onOpenChange={open => !open && onClose()}
      width="3xl"
      srTitle="Assignment details"
      srDescription="The VA, client, activity and reports for this assignment."
    >
      {assignmentId && (
        <AssignmentDetail
          key={assignmentId}
          id={assignmentId}
          onEdit={onEdit}
        />
      )}
    </DetailDrawer>
  );
}

function AssignmentDetail({
  id,
  onEdit,
}: {
  id: string;
  onEdit: (a: IAssignment) => void;
}) {
  const { data: assignmentData, isLoading: loadingAssignment } =
    useAssignmentQuery(id);

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

  const { data: clientAccount = null } = useClientAccountQuery(
    assignment?.clientId
  );
  const { data: vaProfile = null } = useVaProfileQuery(assignment?.candidateId);

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
      <DrawerHeader>
        <InitialsTile name={vaName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold">
              {vaName} — {clientName}
            </h2>
            <AssignmentStatusPill status={assignment.status} />
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {assignment.serviceType ? `${assignment.serviceType} · ` : ''}
            {formatDate(assignment.startDate)}
            {assignment.endDate
              ? ` → ${formatDate(assignment.endDate)}`
              : ' · Ongoing'}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 shrink-0"
          onClick={() => onEdit(assignment)}
        >
          <PenLineIcon className="size-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      </DrawerHeader>

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
            <StatTile
              label="Hours this week"
              value={`${weekHours.toFixed(1)}h`}
            />
            <StatTile label="Entries this week" value={weekEntries.length} />
            <StatTile label="EODs this week" value={weekEods} />
            <StatTile label="Reviews" value={reviewCount} />
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
            <UnderlineTabsList>
              <UnderlineTab value="work">
                Work entries
                <TabCount>{filteredEntries.length}</TabCount>
              </UnderlineTab>
              <UnderlineTab value="eod">
                EOD reports
                <TabCount>{filteredEods.length}</TabCount>
              </UnderlineTab>
            </UnderlineTabsList>

            <div className="my-4 flex flex-wrap items-center gap-1.5">
              <div className="w-48">
                <DatePickerField value={dateFrom} onChange={setDateFrom} />
              </div>
              <span className="text-xs text-muted-foreground">to</span>
              <div className="w-48">
                <DatePickerField value={dateTo} onChange={setDateTo} />
              </div>
              {hasActiveFilters && (
                <ClearFiltersButton onClick={clearFilters} className="ml-1" />
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
