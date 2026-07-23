import {
  ActivityIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  ClockIcon,
  UserIcon,
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
  useEodSubmissionsQuery,
  useMyAssignmentsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import type { IAssignment } from '@/types/assignment';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function weekStartStr() {
  const d = new Date();
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d.toISOString().split('T')[0];
}

const statusVariant: Record<
  IAssignment['status'],
  'default' | 'secondary' | 'destructive'
> = {
  active: 'default',
  on_hold: 'secondary',
  ended: 'destructive',
};

export default function ClientDashboardPage() {
  const user = useAppSelector(s => s.auth.user);
  const today = todayStr();
  const weekStart = weekStartStr();

  const { data: assignmentList = [], isLoading: loadingAssignments } =
    useMyAssignmentsQuery();
  const { data: workAll = [], isLoading: loadingWork } = useWorkEntriesQuery();
  const { data: eods = [], isLoading: loadingEods } = useEodSubmissionsQuery();

  const assignments = assignmentList.filter(a => a.status === 'active');
  const activeAssignments = assignments.length;
  const weekHours =
    workAll
      .filter(e => e.entryDate.slice(0, 10) >= weekStart)
      .reduce((sum, e) => sum + e.timeSpent, 0) / 60;
  const todayCount = workAll.filter(
    e => e.entryDate.slice(0, 10) === today
  ).length;
  const sortedEods = [...eods].sort((a, b) => (b.date > a.date ? 1 : -1));
  const lastEodDate = sortedEods[0]?.date?.slice(0, 10) ?? null;

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
          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Active Assignments</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loadingAssignments ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  activeAssignments
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <BriefcaseIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">Active VA engagements</div>
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
                <ClockIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                Hours billed by your VA Mon–today
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Last EOD Submitted</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loadingEods ? (
                  <Skeleton className="h-8 w-28" />
                ) : lastEodDate ? (
                  new Date(lastEodDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                ) : (
                  'None yet'
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <CalendarCheckIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                Most recent end-of-day report date
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Entries Today</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loadingWork ? <Skeleton className="h-8 w-12" /> : todayCount}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ActivityIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                Work entries logged by your VA today
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Your VA Engagements */}
        <div className="px-4 lg:px-6">
          <h2 className="mb-3 text-base font-semibold">Your VA Engagements</h2>
          {loadingAssignments ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map(n => (
                <Card key={n}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-1 h-3 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-28" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No active VA engagements found.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assignments.map(a => (
                <Card key={a._id} className="">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserIcon className="size-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">
                          {a.serviceType ?? 'VA Engagement'}
                        </CardTitle>
                      </div>
                      <Badge
                        variant={statusVariant[a.status]}
                        className="capitalize text-xs"
                      >
                        {a.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Started {fmtDate(a.startDate)}
                      {a.endDate ? ` · Ends ${fmtDate(a.endDate)}` : ''}
                    </CardDescription>
                  </CardHeader>
                  {a.notes && (
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {a.notes}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick action */}
        <div className="flex gap-3 px-4 lg:px-6">
          <Button asChild>
            <Link to="/client/work">
              <ActivityIcon className="size-4" />
              View Work Activity
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
