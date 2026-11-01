import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { DetailDrawer, DrawerHeader } from '@/components/shared/DetailDrawer';
import { ClearFiltersButton } from '@/components/shared/FilterControls';
import { StatTile } from '@/components/shared/StatTile';
import {
  AssignmentStatusPill,
  HealthBadge,
  InitialsTile,
  ReviewStatusBadge,
  Score,
  SurveyStatusPill,
  WorkloadBadge,
} from '@/components/shared/badges';
import { NotesThread } from '@/features/notes/NotesThread';
import { DataTable } from '@/components/shared/DataTable';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TabCount,
  UnderlineTab,
  UnderlineTabsList,
} from '@/components/shared/UnderlineTabs';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  useAssignmentQuery,
  useClientAccountQuery,
  useCrmAccountsListQuery,
  useEodSubmissionsQuery,
  usePerformanceReviewsQuery,
  useSurveyRemindersQuery,
  useVaProfileQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { formatDate } from '@/lib/format';
import {
  addDaysToDateKey,
  formatDateKeyLong,
  weekStartOfDateKey,
} from '@/lib/time';
import { isOpen } from '@/lib/survey';
import { SURVEY_TYPE_LABELS } from '@/types/survey-reminder';

import {
  buildEodColumns,
  buildWorkColumns,
} from '@/features/assignments/drawer-columns';
import { Party, Row } from '@/features/assignments/drawer-parts';
import { hasBlocker } from '../dashboard/use-am-dashboard';

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
    <DetailDrawer
      open={!!assignmentId}
      onOpenChange={open => !open && onClose()}
      width="3xl"
      srTitle="Assignment details"
      srDescription="The VA, client, activity, notes and follow-ups for this assignment."
    >
      {assignmentId && (
        <AmAssignmentDetail
          key={assignmentId}
          id={assignmentId}
          today={today}
        />
      )}
    </DetailDrawer>
  );
}

function AmAssignmentDetail({ id, today }: { id: string; today: string }) {
  const { data: assignmentData, isLoading: loadingAssignment } =
    useAssignmentQuery(id);
  const assignment = assignmentData ?? null;

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
  // The VA's email comes from the manager's own (scoped) account list.
  const { data: crmAccounts } = useCrmAccountsListQuery();
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
        if (isOpen(a) !== isOpen(b)) return isOpen(a) ? -1 : 1;
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
    r => isOpen(r) && (r.dueDate?.slice(0, 10) ?? '') < today
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
      </DrawerHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-5">
          {/* What needs attention */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              label="Report today"
              value={todayLabel}
              alert={todayLabel === 'Missing'}
            />
            <StatTile
              label="Blockers, last 7 days"
              value={blockers.length}
              alert={blockers.length > 0}
            />
            <StatTile
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
            <StatTile
              label="Hours this week"
              value={`${weekHours.toFixed(1)}h`}
            />
            <StatTile label="Entries this week" value={weekEntries.length} />
            <StatTile label="Reports this week" value={weekReports} />
            <StatTile label="Reviews" value={reviews.length} />
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
            <UnderlineTabsList>
              <UnderlineTab value="work">
                Work entries
                <TabCount>{filteredEntries.length}</TabCount>
              </UnderlineTab>
              <UnderlineTab value="eod">
                Reports
                <TabCount>{filteredEods.length}</TabCount>
              </UnderlineTab>
              <UnderlineTab value="notes">Notes</UnderlineTab>
              <UnderlineTab value="followups">
                Reviews &amp; check-ins
              </UnderlineTab>
            </UnderlineTabsList>

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
                      const late = isOpen(r) && due < today;
                      return (
                        <li
                          key={r._id}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm">
                              {SURVEY_TYPE_LABELS[r.surveyType] ?? r.surveyType}{' '}
                              check-in
                            </p>
                            <p
                              className={`text-xs ${late ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                              Due {due ? formatDateKeyLong(due) : '—'}
                              {late && ' · overdue'}
                            </p>
                          </div>
                          <SurveyStatusPill status={r.status} />
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
                    to="/am/performance"
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
                            {formatDate(r.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <Score value={r.overallRating} withLabel />
                          <ReviewStatusBadge status={r.reviewStatus} />
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
      {active && <ClearFiltersButton onClick={onClear} className="ml-1" />}
    </div>
  );
}
