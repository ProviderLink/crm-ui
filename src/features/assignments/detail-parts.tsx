import { useMemo, useState, type ReactNode } from 'react';

import {
  AssignmentStatusPill,
  HealthBadge,
  InitialsTile,
  Score,
  WorkloadBadge,
} from '@/components/shared/badges';
import { DataTable } from '@/components/shared/DataTable';
import { ClearFiltersButton } from '@/components/shared/FilterControls';
import { StatTile } from '@/components/shared/StatTile';
import {
  TabCount,
  UnderlineTab,
  UnderlineTabsList,
} from '@/components/shared/UnderlineTabs';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { formatDate } from '@/lib/format';
import type { IAssignment } from '@/types/assignment';
import type { IClientAccount } from '@/types/client-account';
import type { IEodSubmission } from '@/types/eod-submission';
import type { IVaProfile } from '@/types/va-profile';
import type { IWorkEntry } from '@/types/work-entry';

import { buildEodColumns, buildWorkColumns } from './drawer-columns';
import { Party, Row } from './drawer-parts';

// The pieces both assignment drawers (admin and account manager) are built
// from. Each drawer loads its own data and decides what to show around them.

/** Shown in place of the drawer body while the assignment loads or is missing. */
export function AssignmentDetailFallback({ loading }: { loading: boolean }) {
  if (loading)
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-muted-foreground">Assignment not found</p>
    </div>
  );
}

/** Who works for whom, with the status and dates; `action` sits on the right. */
export function AssignmentHeaderContent({
  assignment,
  vaName,
  clientName,
  action,
}: {
  assignment: IAssignment;
  vaName: string;
  clientName: string;
  action?: ReactNode;
}) {
  return (
    <>
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
      {action}
    </>
  );
}

/** The VA, the account manager and the client side by side. */
export function AssignmentParties({
  vaName,
  vaEmail,
  vaProfile,
  managerName,
  managerEmail,
  clientName,
  clientAccount,
}: {
  vaName: string;
  vaEmail?: string | null;
  vaProfile: IVaProfile | null;
  managerName: string;
  managerEmail?: string | null;
  clientName: string;
  clientAccount: IClientAccount | null;
}) {
  return (
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
      <Party label="Account manager" name={managerName} email={managerEmail} />
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
  );
}

/** Hours, entries and reports since the start of the week, and the review count. */
export function AssignmentWeekStats({
  entries,
  eods,
  assignmentId,
  weekStart,
  reviewCount,
  reportsLabel,
}: {
  entries: IWorkEntry[];
  eods: IEodSubmission[];
  assignmentId: string;
  /** `YYYY-MM-DD` of the week's first day. */
  weekStart: string;
  reviewCount: number;
  /** What the daily report is called: "EODs" or "Reports". */
  reportsLabel: string;
}) {
  const weekEntries = entries.filter(
    e => e.assignmentId === assignmentId && e.entryDate >= weekStart
  );
  const hours = weekEntries.reduce((sum, e) => sum + e.timeSpent, 0) / 60;
  const reports = eods.filter(e => e.date >= weekStart).length;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile label="Hours this week" value={`${hours.toFixed(1)}h`} />
      <StatTile label="Entries this week" value={weekEntries.length} />
      <StatTile label={`${reportsLabel} this week`} value={reports} />
      <StatTile label="Reviews" value={reviewCount} />
    </div>
  );
}

export function AssignmentNotes({
  notes,
  title = 'Notes',
}: {
  notes: string;
  title?: string;
}) {
  return (
    <div className="space-y-1.5 border-t border-border pt-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
        {notes}
      </p>
    </div>
  );
}

interface ExtraTab {
  value: string;
  label: ReactNode;
  /** Spacing of the tab's content. */
  className: string;
  content: ReactNode;
}

/**
 * Work entries and reports of one assignment as tabs, with a date range that
 * narrows both. `extraTabs` adds tabs of the drawer's own after them.
 */
export function AssignmentActivityTabs({
  assignmentId,
  entries,
  eods,
  loadingEntries,
  loadingEods,
  reportsLabel,
  extraTabs = [],
}: {
  assignmentId: string;
  entries: IWorkEntry[];
  eods: IEodSubmission[];
  loadingEntries: boolean;
  loadingEods: boolean;
  reportsLabel: string;
  extraTabs?: ExtraTab[];
}) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredEntries = useMemo(
    () =>
      entries.filter(
        e =>
          e.assignmentId === assignmentId &&
          (!dateFrom || e.entryDate >= dateFrom) &&
          (!dateTo || e.entryDate <= dateTo)
      ),
    [entries, assignmentId, dateFrom, dateTo]
  );
  const filteredEods = useMemo(
    () =>
      eods.filter(
        e =>
          e.assignmentId === assignmentId &&
          (!dateFrom || e.date >= dateFrom) &&
          (!dateTo || e.date <= dateTo)
      ),
    [eods, assignmentId, dateFrom, dateTo]
  );
  const workColumns = useMemo(() => buildWorkColumns(), []);
  const eodColumns = useMemo(() => buildEodColumns(), []);

  const dateRange = (
    <div className="my-4 flex flex-wrap items-center gap-1.5">
      <div className="w-48">
        <DatePickerField value={dateFrom} onChange={setDateFrom} />
      </div>
      <span className="text-xs text-muted-foreground">to</span>
      <div className="w-48">
        <DatePickerField value={dateTo} onChange={setDateTo} />
      </div>
      {(dateFrom !== '' || dateTo !== '') && (
        <ClearFiltersButton
          className="ml-1"
          onClick={() => {
            setDateFrom('');
            setDateTo('');
          }}
        />
      )}
    </div>
  );

  return (
    <Tabs defaultValue="work" className="border-t border-border pt-5">
      <UnderlineTabsList>
        <UnderlineTab value="work">
          Work entries
          <TabCount>{filteredEntries.length}</TabCount>
        </UnderlineTab>
        <UnderlineTab value="eod">
          {reportsLabel}
          <TabCount>{filteredEods.length}</TabCount>
        </UnderlineTab>
        {extraTabs.map(t => (
          <UnderlineTab key={t.value} value={t.value}>
            {t.label}
          </UnderlineTab>
        ))}
      </UnderlineTabsList>

      <TabsContent value="work" className="mt-0">
        {dateRange}
        {loadingEntries ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <DataTable columns={workColumns} data={filteredEntries} />
        )}
      </TabsContent>

      <TabsContent value="eod" className="mt-0">
        {dateRange}
        {loadingEods ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <DataTable columns={eodColumns} data={filteredEods} />
        )}
      </TabsContent>

      {extraTabs.map(t => (
        <TabsContent key={t.value} value={t.value} className={t.className}>
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
