import { useQuery, useQueryClient } from '@tanstack/react-query';
import { XIcon } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { NotesThread } from '@/components/notes/NotesThread';
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
  useEodSubmissionsQuery,
  usePerformanceReviewsQuery,
  useSurveyRemindersQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import {
  addDaysToDateKey,
  formatDateKeyLong,
  weekStartOfDateKey,
} from '@/lib/time';
import { SURVEY_STATUS_STYLES } from '@/lib/status-styles';
import { getCrmAccountsList } from '@/services/account-managers.service';
import { getAssignment } from '@/services/assignments.service';
import { getClientAccount } from '@/services/client-accounts.service';
import { getVaProfile } from '@/services/va-profiles.service';
import type { IAssignment } from '@/types/assignment';
import type { ISurveyReminder } from '@/types/survey-reminder';

import {
  Avatar,
  HealthBadge,
  Score,
  WorkloadBadge,
} from '../../admin/accounts/badges';
import {
  buildEodColumns,
  buildWorkColumns,
  fmtDate,
  TAB,
  TAB_LIST,
} from '../../admin/assignments/drawer-columns';
import { Party, Row, Stat } from '../../admin/assignments/drawer-parts';
import { AssignmentStatus } from '../../admin/assignments/AssignmentStatus';
import {
  RatingDisplay,
  StatusBadge,
} from '../../admin/performance-reviews-list/badges';
import { hasBlocker } from '../dashboard/use-am-dashboard';

const SURVEY_LABELS: Record<ISurveyReminder['surveyType'], string> = {
  '3_day': '3-Day',
  '1_week': '1-Week',
  '30_day': '30-Day',
  monthly: 'Monthly',
};

const isOpenReminder = (r: ISurveyReminder) =>
  r.status === 'pending' || r.status === 'sent';

/** One tile of the strip at the top: what needs the manager's attention. */
function Attention({
  label,
  value,
  alert,
}: {
  label: string;
  value: ReactNode;
  alert?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 text-base font-semibold tabular-nums ${alert ? 'text-status-warning' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * An assignment opened in a floating drawer over the list. The detail only
 * mounts while one is open, so its filters and tab start fresh each time.
 */
export function AmAssignmentDrawer({
  assignmentId,
  today,
  onClose,
}: {
  assignmentId: string | null;
  today: string;
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
          The VA, client, activity, notes and follow-ups for this assignment.
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
            <AmAssignmentDetail
              key={assignmentId}
              id={assignmentId}
              today={today}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AmAssignmentDetail({ id, today }: { id: string; today: string }) {
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
  // The VA's email comes from the manager's own (scoped) account list.
  const { data: crmAccounts } = useQuery({
    queryKey: ['crm-accounts-list'],
    queryFn: getCrmAccountsList,
  });
  const vaEmail =
    crmAccounts?.vas.find(v => v.candidateRef === assignment?.candidateId)
      ?.email ?? null;

  const { data: reviewsAll = [] } = usePerformanceReviewsQuery(
    assignment ? { candidateId: assignment.candidateId } : undefined
  );
  const { data: remindersAll = [] } = useSurveyRemindersQuery();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredEntries = useMemo(
    () =>
      allEntries.filter(e => {
        if (e.assignmentId !== id) return false;
        if (dateFrom && e.entryDate < dateFrom) return false;
        if (dateTo && e.entryDate > dateTo) return false;
        return true;
      }),
    [allEntries, id, dateFrom, dateTo]
  );
  const filteredEods = useMemo(
    () =>
      allEods.filter(e => {
        if (e.assignmentId !== id) return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        return true;
      }),
    [allEods, id, dateFrom, dateTo]
  );

  const workColumns = useMemo(() => buildWorkColumns(), []);
  const eodColumns = useMemo(() => buildEodColumns(), []);

  // Reviews of this VA for this client, and reminders tied to this assignment,
  // its VA or its client.
  const reviews = useMemo(
    () =>
      assignment
        ? reviewsAll.filter(r => r.clientId === assignment.clientId)
        : [],
    [reviewsAll, assignment]
  );
  const reminders = useMemo(() => {
    if (!assignment) return [];
    const related = new Set([id, assignment.candidateId, assignment.clientId]);
    return remindersAll
      .filter(r => related.has(r.relatedId))
      .sort((a, b) => {
        if (isOpenReminder(a) !== isOpenReminder(b))
          return isOpenReminder(a) ? -1 : 1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [remindersAll, assignment, id]);

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

  const vaName = assignment.candidateName || 'VA';
  const clientName = assignment.companyName || 'Client';

  // What needs attention
  const submittedToday = allEods.some(e => e.date === today);
  const blockerFrom = addDaysToDateKey(today, -7);
  const blockers = allEods.filter(e => e.date >= blockerFrom && hasBlocker(e));
  const overdue = reminders.filter(
    r => isOpenReminder(r) && (r.dueDate?.slice(0, 10) ?? '') < today
  );
  const todayLabel =
    assignment.status === 'active'
      ? submittedToday
        ? 'Submitted'
        : 'Missing'
      : '—';

  // This week
  const weekStart = weekStartOfDateKey(today);
  const weekEntries = allEntries.filter(
    e => e.assignmentId === id && e.entryDate >= weekStart
  );
  const weekHours = weekEntries.reduce((s, e) => s + e.timeSpent, 0) / 60;
  const weekReports = allEods.filter(e => e.date >= weekStart).length;

  const hasActiveFilters = dateFrom !== '' || dateTo !== '';

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
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-5">
          {/* What needs attention */}
          <div className="grid grid-cols-3 gap-3">
            <Attention
              label="Report today"
              value={todayLabel}
              alert={todayLabel === 'Missing'}
            />
            <Attention
              label="Blockers, last 7 days"
              value={blockers.length}
              alert={blockers.length > 0}
            />
            <Attention
              label="Overdue check-ins"
              value={overdue.length}
              alert={overdue.length > 0}
            />
          </div>

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
              name={assignment.accountManagerName || '—'}
              email={assignment.accountManagerEmail}
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
            <Stat label="Reports this week" value={weekReports} />
            <Stat label="Reviews" value={reviews.length} />
          </div>

          {assignment.notes && (
            <div className="space-y-1.5 border-t border-border pt-5">
              <h3 className="text-sm font-semibold">Assignment notes</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {assignment.notes}
              </p>
            </div>
          )}

          <Tabs defaultValue="work" className="border-t border-border pt-5">
            <TabsList className={TAB_LIST}>
              <TabsTrigger value="work" className={TAB}>
                Work entries
                <span className="text-xs font-normal tabular-nums text-muted-foreground">
                  {filteredEntries.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="eod" className={TAB}>
                Reports
                <span className="text-xs font-normal tabular-nums text-muted-foreground">
                  {filteredEods.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="notes" className={TAB}>
                Notes
              </TabsTrigger>
              <TabsTrigger value="followups" className={TAB}>
                Reviews &amp; check-ins
              </TabsTrigger>
            </TabsList>

            <TabsContent value="work" className="mt-0">
              <DateRange
                from={dateFrom}
                to={dateTo}
                onFrom={setDateFrom}
                onTo={setDateTo}
                active={hasActiveFilters}
                onClear={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
              />
              {loadingEntries ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <DataTable columns={workColumns} data={filteredEntries} />
              )}
            </TabsContent>

            <TabsContent value="eod" className="mt-0">
              <DateRange
                from={dateFrom}
                to={dateTo}
                onFrom={setDateFrom}
                onTo={setDateTo}
                active={hasActiveFilters}
                onClear={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
              />
              {loadingEods ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <DataTable columns={eodColumns} data={filteredEods} />
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-5">
              <NotesThread
                subjectType="va"
                subjectId={assignment.candidateId}
                title={`Notes on ${vaName}`}
              />
              <NotesThread
                subjectType="client"
                subjectId={assignment.clientId}
                title={`Notes on ${clientName}`}
              />
            </TabsContent>

            <TabsContent value="followups" className="mt-4 space-y-6">
              <section className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold">Check-ins</h3>
                  <Link
                    to="/am/reminders"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Manage check-ins →
                  </Link>
                </div>
                {reminders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No check-ins for this assignment.
                  </p>
                ) : (
                  <ul className="divide-y divide-border rounded-lg border border-white/[0.1] bg-white/[0.03]">
                    {reminders.map(r => {
                      const due = r.dueDate?.slice(0, 10) ?? '';
                      const late = isOpenReminder(r) && due < today;
                      return (
                        <li
                          key={r._id}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm">
                              {SURVEY_LABELS[r.surveyType] ?? r.surveyType}{' '}
                              check-in
                            </p>
                            <p
                              className={`text-xs ${late ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                              Due {due ? formatDateKeyLong(due) : '—'}
                              {late && ' · overdue'}
                            </p>
                          </div>
                          <span
                            className={`rounded border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap capitalize ${SURVEY_STATUS_STYLES[r.status]}`}
                          >
                            {r.status}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold">Reviews</h3>
                  <Link
                    to="/am/performance-reviews"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Open reviews →
                  </Link>
                </div>
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No performance reviews yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border rounded-lg border border-white/[0.1] bg-white/[0.03]">
                    {reviews.map(r => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm">{r.reviewType} review</p>
                          <p className="text-xs text-muted-foreground">
                            {fmtDate(r.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <RatingDisplay rating={r.overallRating} />
                          <StatusBadge status={r.reviewStatus} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

function DateRange({
  from,
  to,
  onFrom,
  onTo,
  active,
  onClear,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  active: boolean;
  onClear: () => void;
}) {
  return (
    <div className="my-4 flex flex-wrap items-center gap-1.5">
      <div className="w-48">
        <DatePickerField value={from} onChange={onFrom} />
      </div>
      <span className="text-xs text-muted-foreground">to</span>
      <div className="w-48">
        <DatePickerField value={to} onChange={onTo} />
      </div>
      {active && (
        <button
          type="button"
          onClick={onClear}
          className="ml-1 inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <XIcon className="size-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
