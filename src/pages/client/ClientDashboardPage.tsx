import { ActivityIcon, ClockIcon, UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { EodComplianceCard, LastEodCard } from './client-dashboard/EodStatCards';
import { PastEngagementCard } from './client-dashboard/PastEngagementCard';
import { RecentEodItem } from './client-dashboard/RecentEodItem';
import { useDashboardData } from './client-dashboard/use-dashboard-data';
import { VaTeamCard } from './client-dashboard/VaTeamCard';

export default function ClientDashboardPage() {
  const d = useDashboardData();

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Page heading */}
        <div className="px-4 lg:px-6">
          <p className="text-sm font-medium text-muted-foreground mb-0.5">
            Welcome back,
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {d.user?.name ?? 'Dashboard'}
          </h1>
        </div>


        {/* Stat cards */}
        <div className="*:data-[slot=card]:@xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 lg:px-6">
          <StatCard
            label="Active Assignments"
            value={d.activeAssignments.length}
            isLoading={d.loadingAssignments}
            icon={UsersIcon}
            footer={
              d.onHoldAssignments.length > 0
                ? `${d.onHoldAssignments.length} on hold`
                : 'VA engagements currently active'
            }
          />
          <StatCard
            label="This Week's Hours"
            value={parseFloat(d.weekHours.toFixed(1))}
            isLoading={d.loadingWork}
            icon={ClockIcon}
            footer="Total hours logged Mon – today"
          />
          <EodComplianceCard
            eodCompliance={d.eodCompliance}
            loading={d.loadingEods || d.loadingAssignments}
          />
          <LastEodCard lastEodDate={d.lastEodDate} loading={d.loadingEods} />
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
          {d.loadingAssignments ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : d.visibleAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active VA engagements found.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {d.visibleAssignments.map(a => (
                <VaTeamCard
                  key={a._id}
                  assignment={a}
                  displayName={d.vaNameMap[a.candidateId] ?? 'VA'}
                  weekHours={d.vaWeekHours(a.candidateId)}
                  lastEod={d.vaLastEod(a.candidateId)}
                  loadingWork={d.loadingWork}
                  loadingEods={d.loadingEods}
                />
              ))}
            </div>
          )}
        </div>

        {/* Past Engagements */}
        {d.endedAssignments.length > 0 && (
          <div className="px-4 lg:px-6 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Past Engagements
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {d.endedAssignments.map(a => (
                <PastEngagementCard
                  key={a._id}
                  assignment={a}
                  displayName={d.vaNameMap[a.candidateId] ?? 'VA'}
                />
              ))}
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
              {d.loadingEods ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : d.recentEodsList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No EOD reports submitted yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {d.recentEodsList.map(eod => (
                    <RecentEodItem
                      key={eod._id}
                      eod={eod}
                      displayName={d.vaNameMap[eod.candidateId] ?? 'VA'}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
