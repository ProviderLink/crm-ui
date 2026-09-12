import {
  ActivityIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  CalendarIcon,
  ClockIcon,
  MailIcon,
  ShieldCheckIcon,
  UsersIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { StatCard } from '@/components/shared/StatCard';
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
import {
  useEodContextQuery,
  useEodSubmissionsQuery,
  useHiredVasForClientQuery,
  useMyAllAssignmentsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import {
  addDaysToDateKey,
  formatDateKeyLong,
  formatDateKeyShort,
  todayString,
  weekdayOfDateKey,
} from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

function fmtDate(iso: string) {
  return formatDateKeyLong(iso);
}

function daysAgoStr(dateKey: string, n: number) {
  return addDaysToDateKey(dateKey, -n);
}

function tenureLabel(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (months < 1) return '< 1 month';
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0
    ? `${years}y ${rem}mo`
    : `${years} year${years > 1 ? 's' : ''}`;
}

function initials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const assignmentBadge: Record<
  IAssignment['status'],
  { className: string; label: string }
> = {
  active: {
    className: 'border-green-500/40 text-green-400 bg-green-500/10',
    label: 'Active',
  },
  on_hold: {
    className: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
    label: 'On Hold',
  },
  ended: {
    className: 'border-muted text-muted-foreground bg-transparent',
    label: 'Ended',
  },
};

export default function ClientDashboardPage() {
  const user = useAppSelector(s => s.auth.user);
  // Compliance is measured against the company business day so VAs in any
  // timezone are judged on the same calendar.
  const { data: eodContext } = useEodContextQuery();
  const today = eodContext?.dateKey ?? todayString();
  const weekStart = (() => {
    const dow = weekdayOfDateKey(today);
    return addDaysToDateKey(today, -(dow === 0 ? 6 : dow - 1));
  })();
  const sevenDaysAgo = addDaysToDateKey(today, -7);

  const { data: allAssignments = [], isLoading: loadingAssignments } =
    useMyAllAssignmentsQuery();
  const { data: hiredVAs = [] } = useHiredVasForClientQuery(
    user?.clientRef ?? undefined
  );
  const { data: workAll = [], isLoading: loadingWork } = useWorkEntriesQuery();
  const { data: eods = [], isLoading: loadingEods } = useEodSubmissionsQuery();

  // Build VA name map from hired-vas endpoint (client-scoped, always accessible)
  const vaNameMap: Record<string, string> = {};
  for (const v of hiredVAs) vaNameMap[v.id] = `${v.firstName} ${v.lastName}`;

  const activeAssignments = allAssignments.filter(a => a.status === 'active');
  const onHoldAssignments = allAssignments.filter(a => a.status === 'on_hold');
  const endedAssignments = allAssignments.filter(a => a.status === 'ended');
  const visibleAssignments = [...activeAssignments, ...onHoldAssignments];

  // This week's total hours across all VAs
  const weekHours =
    workAll
      .filter(e => e.entryDate.slice(0, 10) >= weekStart)
      .reduce((sum, e) => sum + e.timeSpent, 0) / 60;

  // EOD compliance last 7 working days
  const activeCandidateIds = new Set(activeAssignments.map(a => a.candidateId));
  const recentEods = eods.filter(e => e.date >= sevenDaysAgo);
  const recentEodSet = new Set(
    recentEods.map(e => `${e.candidateId}::${e.date}`)
  );
  const workingDaysLast7 = Array.from({ length: 7 }, (_, i) =>
    daysAgoStr(today, i)
  ).filter(d => {
    const day = weekdayOfDateKey(d);
    return day >= 1 && day <= 5 && d <= today;
  });
  const expectedEods = activeCandidateIds.size * workingDaysLast7.length;
  const submittedEods = workingDaysLast7.reduce(
    (sum, day) =>
      sum +
      [...activeCandidateIds].filter(id => recentEodSet.has(`${id}::${day}`))
        .length,
    0
  );
  const eodCompliance =
    expectedEods > 0 ? Math.round((submittedEods / expectedEods) * 100) : null;

  // Per-VA helpers
  function vaWeekHours(candidateId: string) {
    return (
      workAll
        .filter(
          e =>
            e.candidateId === candidateId &&
            e.entryDate.slice(0, 10) >= weekStart
        )
        .reduce((sum, e) => sum + e.timeSpent, 0) / 60
    );
  }

  function vaLastEod(candidateId: string) {
    return (
      [...eods]
        .filter(e => e.candidateId === candidateId)
        .sort((a, b) => (b.date > a.date ? 1 : -1))[0]?.date ?? null
    );
  }

  const sortedEods = [...eods].sort((a, b) => (b.date > a.date ? 1 : -1));
  const recentEodsList = sortedEods.slice(0, 6);
  const lastEodDate = sortedEods[0]?.date ?? null;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Page heading */}
        <div className="px-4 lg:px-6">
          <p className="text-sm font-medium text-muted-foreground mb-0.5">
            Welcome back,
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {user?.name ?? 'Dashboard'}
          </h1>
        </div>

        {/* Stat cards */}
        <div className="*:data-[slot=card]:@xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 lg:px-6">
          <StatCard
            label="Active Assignments"
            value={activeAssignments.length}
            isLoading={loadingAssignments}
            icon={UsersIcon}
            footer={
              onHoldAssignments.length > 0
                ? `${onHoldAssignments.length} on hold`
                : 'VA engagements currently active'
            }
          />
          <StatCard
            label="This Week's Hours"
            value={parseFloat(weekHours.toFixed(1))}
            isLoading={loadingWork}
            icon={ClockIcon}
            footer="Total hours logged Mon – today"
          />
          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>EOD Compliance</CardDescription>
              <CardTitle
                className={`@[250px]/card:text-3xl text-2xl font-semibold tabular-nums ${
                  !loadingEods && eodCompliance !== null
                    ? eodCompliance >= 80
                      ? 'text-green-400'
                      : eodCompliance >= 50
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    : ''
                }`}
              >
                {loadingEods || loadingAssignments ? (
                  <Skeleton className="h-8 w-16 rounded-md mt-0.5" />
                ) : eodCompliance === null ? (
                  '—'
                ) : (
                  `${eodCompliance}%`
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <CalendarCheckIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <div className="flex flex-col items-start gap-1 p-6 pt-0 text-sm">
              <div className="text-muted-foreground">
                End-of-day reports last 7 working days
              </div>
            </div>
          </Card>
          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Last EOD Submitted</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loadingEods ? (
                  <Skeleton className="h-8 w-24 rounded-md mt-0.5" />
                ) : lastEodDate ? (
                  <span className="text-xl">
                    {new Date(lastEodDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                ) : (
                  '—'
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ActivityIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <div className="flex flex-col items-start gap-1 p-6 pt-0 text-sm">
              <div className="text-muted-foreground">
                Most recent end-of-day report
              </div>
            </div>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 px-4 lg:px-6">
          <Button asChild>
            <Link to="/client/work">
              <ActivityIcon className="size-4" />
              View Work Activity
            </Link>
          </Button>
        </div>

        {/* VA Team */}
        <div className="px-4 lg:px-6 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Your VA Team
          </h2>
          {loadingAssignments ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : visibleAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active VA engagements found.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleAssignments.map(a => {
                const vaName = vaNameMap[a.candidateId] ?? null;
                const displayName = vaName ?? 'VA';
                const wkHrs = vaWeekHours(a.candidateId);
                const lastEod = vaLastEod(a.candidateId);
                const badge = assignmentBadge[a.status];
                return (
                  <Card key={a._id} className="flex flex-col gap-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[#A0A0A0] font-mono text-xs font-medium">
                            {initials(displayName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                              VA
                            </p>
                            <CardTitle className="text-base leading-snug">
                              {displayName}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${badge.className} shrink-0`}
                        >
                          {badge.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 pb-4 pt-0">
                      {/* Role */}
                      {a.serviceType && (
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                            Role
                          </p>
                          <span className="flex items-center gap-1.5 text-sm text-foreground">
                            <BriefcaseIcon className="size-3 shrink-0 text-muted-foreground" />
                            {a.serviceType}
                          </span>
                        </div>
                      )}

                      {/* Duration */}
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                          Duration
                        </p>
                        <span className="flex items-center gap-1.5 text-sm text-foreground">
                          <CalendarIcon className="size-3 shrink-0 text-muted-foreground" />
                          {fmtDate(a.startDate)}
                          <span className="text-muted-foreground">→</span>
                          {a.endDate ? (
                            fmtDate(a.endDate)
                          ) : (
                            <span className="text-green-400">
                              Present · {tenureLabel(a.startDate)}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Account Manager */}
                      {(a.accountManagerName || a.accountManagerEmail) && (
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                            Account Manager
                          </p>
                          {a.accountManagerName && (
                            <span className="flex items-center gap-1.5 text-sm text-foreground">
                              <ShieldCheckIcon className="size-3 shrink-0 text-muted-foreground" />
                              {a.accountManagerName}
                            </span>
                          )}
                          {a.accountManagerEmail && (
                            <a
                              href={`mailto:${a.accountManagerEmail}`}
                              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-0.5 transition-colors"
                            >
                              <MailIcon className="size-3 shrink-0" />
                              {a.accountManagerEmail}
                            </a>
                          )}
                        </div>
                      )}

                      {/* This week stats */}
                      <div className="flex items-center gap-4 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 mt-1">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            This week
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            {loadingWork ? '…' : `${wkHrs.toFixed(1)}h`}
                          </p>
                        </div>
                        <div className="w-px self-stretch bg-white/[0.06]" />
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Last EOD
                          </p>
                          <p className="text-sm font-semibold">
                            {loadingEods
                              ? '…'
                              : lastEod
                                ? new Date(lastEod).toLocaleDateString(
                                    'en-US',
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                    }
                                  )
                                : 'None'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Engagements */}
        {endedAssignments.length > 0 && (
          <div className="px-4 lg:px-6 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Past Engagements
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {endedAssignments.map(a => {
                const vaName = vaNameMap[a.candidateId] ?? null;
                const displayName = vaName ?? 'VA';
                return (
                  <Card key={a._id} className="flex flex-col gap-0 opacity-60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[#A0A0A0] font-mono text-xs font-medium">
                            {initials(displayName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                              VA
                            </p>
                            <CardTitle className="text-base leading-snug">
                              {displayName}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-muted text-muted-foreground bg-transparent shrink-0"
                        >
                          Ended
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4 pt-0 flex flex-col gap-2">
                      {a.serviceType && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <BriefcaseIcon className="size-3 shrink-0" />
                          {a.serviceType}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarIcon className="size-3 shrink-0" />
                        {fmtDate(a.startDate)}
                        {a.endDate ? ` – ${fmtDate(a.endDate)}` : ''}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent EOD Reports */}
        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Recent EOD Reports
              </CardTitle>
              <CardDescription>
                Latest end-of-day submissions from your VAs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEods ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : recentEodsList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No EOD reports submitted yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentEodsList.map(eod => {
                    const vaName = vaNameMap[eod.candidateId] ?? null;
                    const displayName = vaName ?? 'VA';
                    return (
                      <div
                        key={eod._id}
                        className="flex items-start gap-3 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[#A0A0A0] font-mono text-[10px] font-medium mt-0.5">
                          {initials(displayName)}
                        </div>
                        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                              {displayName}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                              {formatDateKeyShort(eod.date)}
                              {' · '}
                              {eod.hoursWorked}h
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {eod.workEntries && eod.workEntries.length > 0
                              ? eod.workEntries
                                  .map(
                                    e =>
                                      `${e.task}${e.quantity ? ` ×${e.quantity}` : ''}`
                                  )
                                  .join(' · ')
                              : eod.summaryOfWork || '—'}
                          </p>
                          {eod.pendingTasks && (
                            <p className="text-xs text-muted-foreground/70 line-clamp-1">
                              <span className="font-medium text-[#A0A0A0]">
                                Pending:{' '}
                              </span>
                              {eod.pendingTasks}
                            </p>
                          )}
                          {eod.blockers && (
                            <p className="text-xs text-red-400/70 line-clamp-1">
                              <span className="font-medium">Blockers: </span>
                              {eod.blockers}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
