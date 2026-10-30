import {
  ActivityIcon,
  ArrowRightIcon,
  CalendarCheckIcon,
  ClockIcon,
  FileTextIcon,
  UsersIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { EodDetailSheet } from '@/components/eod/EodDetailSheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { IEodSubmission } from '@/types/eod-submission';

import { DashboardStatCard } from '../admin/admin-dashboard/DashboardStatCard';
import { formatMonthDay } from './client-dashboard/helpers';
import { PastEngagementCard } from './client-dashboard/PastEngagementCard';
import { RecentEodItem } from './client-dashboard/RecentEodItem';
import { useDashboardData } from './client-dashboard/use-dashboard-data';
import { VaTeamCard } from './client-dashboard/VaTeamCard';

// Colour is carried by the number's text only, never a fill.
const rateColor = (rate: number | null) =>
  rate === null
    ? ''
    : rate >= 80
      ? 'text-status-success'
      : rate >= 50
        ? 'text-status-warning'
        : 'text-status-error';

export default function ClientDashboardPage() {
  const d = useDashboardData();
  const [openEod, setOpenEod] = useState<IEodSubmission | null>(null);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-6 py-4 md:py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome back{d.user?.name ? `, ${d.user.name}` : ''}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Here’s how your VAs are doing
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/client/work">
              <ActivityIcon className="size-4" />
              View work activity
            </Link>
          </Button>
        </div>

        {/* At a glance */}
        <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
          <DashboardStatCard
            label="VAs working for you"
            value={d.activeAssignments.length}
            icon={UsersIcon}
            isLoading={d.loadingAssignments}
            to="/client/work"
          >
            {d.onHoldAssignments.length > 0
              ? `${d.onHoldAssignments.length} on hold`
              : 'All currently active'}
          </DashboardStatCard>

          <DashboardStatCard
            label="Hours this week"
            value={`${parseFloat(d.weekHours.toFixed(1))}h`}
            icon={ClockIcon}
            isLoading={d.loadingWork}
            to="/client/work"
          >
            Across all your VAs, Mon–today
          </DashboardStatCard>

          <DashboardStatCard
            label="Daily reports"
            value={d.eodCompliance === null ? '—' : `${d.eodCompliance}%`}
            valueClassName={rateColor(d.eodCompliance)}
            icon={CalendarCheckIcon}
            isLoading={d.loadingEods || d.loadingAssignments}
            to="/client/work"
          >
            Submitted on the last 7 working days
          </DashboardStatCard>

          <DashboardStatCard
            label="Latest report"
            value={d.lastEodDate ? formatMonthDay(d.lastEodDate) : '—'}
            icon={FileTextIcon}
            isLoading={d.loadingEods}
            to="/client/work"
          >
            Most recent daily report
          </DashboardStatCard>
        </div>

        {/* VA team */}
        <div className="flex flex-col gap-3 px-4 lg:px-6">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Your VA team
            </h2>
            {!d.loadingAssignments && d.visibleAssignments.length > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {d.visibleAssignments.length}
              </span>
            )}
          </div>
          {d.loadingAssignments ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-52 w-full rounded-xl" />
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

        {/* Recent daily reports */}
        <div className="px-4 lg:px-6">
          <Card className="gap-4 p-5">
            <CardHeader className="flex-row items-baseline justify-between gap-3 space-y-0 p-0">
              <CardTitle className="text-sm font-medium">
                Recent daily reports
              </CardTitle>
              <Link
                to="/client/work"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
                <ArrowRightIcon className="size-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 pt-1">
              {d.loadingEods ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                  ))}
                </div>
              ) : d.recentEodsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No daily reports submitted yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {d.recentEodsList.map(eod => (
                    <RecentEodItem
                      key={eod._id}
                      eod={eod}
                      displayName={d.vaNameMap[eod.candidateId] ?? 'VA'}
                      onOpen={() => setOpenEod(eod)}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Past engagements */}
        {d.endedAssignments.length > 0 && (
          <div className="flex flex-col gap-3 px-4 lg:px-6">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Past engagements
            </h2>
            <Card className="p-5">
              <ul className="divide-y divide-border">
                {d.endedAssignments.map(a => (
                  <PastEngagementCard
                    key={a._id}
                    assignment={a}
                    displayName={d.vaNameMap[a.candidateId] ?? 'VA'}
                  />
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>

      <EodDetailSheet
        eodId={openEod?._id ?? null}
        fallback={openEod}
        reportName="daily report"
        onOpenChange={open => !open && setOpenEod(null)}
      />
    </div>
  );
}
