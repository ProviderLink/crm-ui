import {
  BriefcaseIcon,
  CalendarIcon,
  ClipboardCheckIcon,
  ClockIcon,
  MailIcon,
  PlusIcon,
  TrophyIcon,
  UserIcon,
  ZapIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEodContextQuery,
  useEodSubmissionsQuery,
  useMyAllAssignmentsQuery,
  useScorecardsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { todayString } from '@/lib/time';

function weekStartStr() {
  const d = new Date();
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function VaDashboardPage() {
  const today = todayString();
  const weekStart = weekStartStr();
  // EOD compliance is judged on the company's business day, not the device's.
  const { data: eodContext } = useEodContextQuery();
  const companyToday = eodContext?.dateKey ?? today;

  const { data: workAll = [], isLoading: loadingWork } = useWorkEntriesQuery();
  const { data: todayEods = [], isLoading: loadingEods } =
    useEodSubmissionsQuery({
      date: companyToday,
    });
  const { data: scorecards = [], isLoading: loadingScores } =
    useScorecardsQuery();
  const { data: allAssignments = [], isLoading: loadingAssignments } =
    useMyAllAssignmentsQuery();

  const todayEntries = workAll.filter(e => e.entryDate.slice(0, 10) === today);
  const eodSubmitted = todayEods.length > 0;
  const weekHours =
    workAll
      .filter(e => e.entryDate.slice(0, 10) >= weekStart)
      .reduce((sum, e) => sum + e.timeSpent, 0) / 60;
  const sorted = [...scorecards].sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );
  const latestScore = sorted[0]?.productivityScore ?? null;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Stat cards */}
        <div className="*:data-[slot=card]:@xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 lg:px-6">
          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Entries Today</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loadingWork ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  todayEntries.length
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ClockIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                Work entries logged today
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>EOD Status</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loadingEods ? (
                  <Skeleton className="h-8 w-28" />
                ) : eodSubmitted ? (
                  'Submitted'
                ) : (
                  'Pending'
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ClipboardCheckIcon
                  className={`size-4 ${!loadingEods && eodSubmitted ? 'text-[#A0A0A0]' : 'text-muted-foreground'}`}
                />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                End-of-day report for today
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>This Week's Hours</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loadingWork ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  `${weekHours.toFixed(1)}h`
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ZapIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                Total time logged Mon–today
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Productivity Score</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loadingScores ? (
                  <Skeleton className="h-8 w-16" />
                ) : latestScore !== null ? (
                  `${latestScore}`
                ) : (
                  'N/A'
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <TrophyIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                Latest weekly scorecard (0–100)
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 px-4 lg:px-6">
          <Button asChild>
            <Link to="/va/work/new">
              <PlusIcon className="size-4" />
              Log Work Entry
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/va/eod/new">
              <ClipboardCheckIcon className="size-4" />
              {eodSubmitted ? 'EOD Submitted ✓' : 'Submit EOD'}
            </Link>
          </Button>
        </div>

        {/* My Assignments */}
        <div className="px-4 lg:px-6 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            My Assignments
          </h2>
          {loadingAssignments ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : allAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assignments found.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {allAssignments.map(a => (
                <Card key={a._id} className="flex flex-col gap-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                          Role
                        </p>
                        <CardTitle className="text-base leading-snug">
                          {a.serviceType ?? 'VA Service'}
                        </CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          a.status === 'active'
                            ? 'border-green-500/40 text-green-400 bg-green-500/10 shrink-0'
                            : a.status === 'on_hold'
                              ? 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10 shrink-0'
                              : 'border-muted text-muted-foreground shrink-0'
                        }
                      >
                        {a.status === 'active'
                          ? 'Active'
                          : a.status === 'on_hold'
                            ? 'On Hold'
                            : 'Ended'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 pb-4 pt-0">
                    {a.companyName && (
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                          Client
                        </p>
                        <span className="flex items-center gap-1.5 text-sm text-foreground">
                          <BriefcaseIcon className="size-3 shrink-0 text-muted-foreground" />
                          {a.companyName}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                        Duration
                      </p>
                      <span className="flex items-center gap-1.5 text-sm text-foreground">
                        <CalendarIcon className="size-3 shrink-0 text-muted-foreground" />
                        {new Date(a.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        <span className="text-muted-foreground">→</span>
                        {a.endDate ? (
                          new Date(a.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        ) : (
                          <span className="text-green-400">Present</span>
                        )}
                      </span>
                    </div>
                    {(a.accountManagerName || a.accountManagerEmail) && (
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                          Account Manager
                        </p>
                        {a.accountManagerName && (
                          <span className="flex items-center gap-1.5 text-sm text-foreground">
                            <UserIcon className="size-3 shrink-0 text-muted-foreground" />
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
