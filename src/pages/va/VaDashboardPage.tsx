import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  ClockIcon,
  MailIcon,
  PlusIcon,
  UserIcon,
  ZapIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEodContextQuery,
  useEodSubmissionsQuery,
  useMyAllAssignmentsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import {
  formatDateKeyLong,
  formatMinutes,
  todayString,
  weekStartOfDateKey,
} from '@/lib/time';

import { DashboardStatCard } from '../admin/admin-dashboard/DashboardStatCard';
import { AssignmentStatus } from '../admin/assignments/AssignmentStatus';
import { StatusPill } from '../admin/work-entries/StatusPill';

const MAX_TODAY_ROWS = 5;

export default function VaDashboardPage() {
  const today = todayString();
  const weekStart = weekStartOfDateKey(today);
  // EOD compliance is judged on the company's business day, not the device's.
  const { data: eodContext } = useEodContextQuery();
  const companyToday = eodContext?.dateKey ?? today;

  // Everything shown here is from this week, so only ask for this week.
  const { data: workAll = [], isLoading: loadingWork } = useWorkEntriesQuery({
    dateFrom: weekStart,
  });
  const { data: todayEods = [], isLoading: loadingEods } =
    useEodSubmissionsQuery({
      date: companyToday,
    });
  const { data: allAssignments = [], isLoading: loadingAssignments } =
    useMyAllAssignmentsQuery();

  const todayEntries = workAll.filter(e => e.entryDate.slice(0, 10) === today);
  const eodSubmitted = todayEods.length > 0;
  const weekEntries = workAll.filter(
    e => e.entryDate.slice(0, 10) >= weekStart
  );
  const weekHours = weekEntries.reduce((sum, e) => sum + e.timeSpent, 0) / 60;

  // Latest first, so the most recent task leads.
  const latestToday = [...todayEntries]
    .sort((a, b) => (b.entryTime ?? '').localeCompare(a.entryTime ?? ''))
    .slice(0, MAX_TODAY_ROWS);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-6 py-4 md:py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your day at a glance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/va/eod/new">
                <ClipboardCheckIcon className="size-4" />
                {eodSubmitted ? 'EOD submitted' : 'Submit EOD'}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/va/work/new">
                <PlusIcon className="size-4" />
                Log Work Entry
              </Link>
            </Button>
          </div>
        </div>

        {/* Today at a glance */}
        <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3 lg:px-6">
          <DashboardStatCard
            label="Entries today"
            value={todayEntries.length}
            icon={ClockIcon}
            isLoading={loadingWork}
            to="/va/work/history"
          >
            Work entries logged today
          </DashboardStatCard>

          <DashboardStatCard
            label="EOD status"
            value={eodSubmitted ? 'Submitted' : 'Pending'}
            icon={ClipboardCheckIcon}
            valueClassName={eodSubmitted ? '' : 'text-status-warning'}
            isLoading={loadingEods}
            to={eodSubmitted ? '/va/eod/history' : '/va/eod/new'}
          >
            {eodSubmitted
              ? 'Today’s report is in'
              : 'Submit today’s end-of-day report'}
          </DashboardStatCard>

          <DashboardStatCard
            label="This week’s hours"
            value={`${weekHours.toFixed(1)}h`}
            icon={ZapIcon}
            isLoading={loadingWork}
            to="/va/work/history"
          >
            {weekEntries.length} {weekEntries.length === 1 ? 'entry' : 'entries'}{' '}
            logged Mon–today
          </DashboardStatCard>
        </div>

        {/* Today's work */}
        <div className="px-4 lg:px-6">
          <Card className="gap-4 p-5">
            <CardHeader className="p-0">
              <CardTitle className="text-sm font-medium">Today’s work</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3">
              {loadingWork ? (
                <Skeleton className="h-24 w-full rounded-md" />
              ) : latestToday.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing logged yet today.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {latestToday.map(e => (
                    <li
                      key={e._id}
                      className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p
                          className="truncate text-sm"
                          title={e.taskDescription}
                        >
                          {e.taskDescription}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.taskCategory}
                          {e.entryTime && ` · ${e.entryTime}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {formatMinutes(e.timeSpent)}
                        </span>
                        <StatusPill status={e.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {todayEntries.length > 0 && (
                <Link
                  to="/va/work/history"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {todayEntries.length > MAX_TODAY_ROWS
                    ? `View all work (${todayEntries.length} today)`
                    : 'View work history'}
                  <ArrowRightIcon className="size-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Assignments */}
        <div className="flex flex-col gap-3 px-4 lg:px-6">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              My assignments
            </h2>
            {!loadingAssignments && allAssignments.length > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {allAssignments.length}
              </span>
            )}
          </div>
          {loadingAssignments ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-36 w-full rounded-xl" />
              ))}
            </div>
          ) : allAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assignments found.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {allAssignments.map(a => (
                <Card key={a._id} className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {a.serviceType ?? 'VA Service'}
                      </p>
                      {a.companyName && (
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                          <BriefcaseIcon className="size-3 shrink-0" />
                          {a.companyName}
                        </p>
                      )}
                    </div>
                    <AssignmentStatus status={a.status} />
                  </div>

                  <dl className="space-y-2 border-t border-border pt-4 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarIcon className="size-3" />
                        Duration
                      </dt>
                      <dd className="text-right">
                        {formatDateKeyLong(a.startDate)}
                        <span className="text-muted-foreground"> → </span>
                        {a.endDate ? (
                          formatDateKeyLong(a.endDate)
                        ) : (
                          <span className="text-muted-foreground">
                            Present
                          </span>
                        )}
                      </dd>
                    </div>
                    {(a.accountManagerName || a.accountManagerEmail) && (
                      <div className="flex items-start justify-between gap-3">
                        <dt className="flex items-center gap-1.5 text-muted-foreground">
                          <UserIcon className="size-3" />
                          Account manager
                        </dt>
                        <dd className="min-w-0 text-right">
                          {a.accountManagerName && (
                            <p className="truncate">{a.accountManagerName}</p>
                          )}
                          {a.accountManagerEmail && (
                            <a
                              href={`mailto:${a.accountManagerEmail}`}
                              className="mt-0.5 inline-flex max-w-full items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                            >
                              <MailIcon className="size-3 shrink-0" />
                              <span className="truncate">
                                {a.accountManagerEmail}
                              </span>
                            </a>
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
