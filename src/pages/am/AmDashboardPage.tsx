import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  ClockIcon,
  MessageSquareWarningIcon,
  UsersIcon,
} from 'lucide-react';
import { useState } from 'react';

import { EodDetailSheet } from '@/components/eod/EodDetailSheet';
import type { IEodSubmission } from '@/types/eod-submission';

import { DashboardStatCard } from '../admin/admin-dashboard/DashboardStatCard';
import { NeedsAttentionCard } from '../admin/admin-dashboard/NeedsAttentionCard';
import { BlockersCard } from './dashboard/BlockersCard';
import { TeamTodayCard } from './dashboard/TeamTodayCard';
import { useAmDashboard } from './dashboard/use-am-dashboard';

export default function AmDashboardPage() {
  const d = useAmDashboard();
  const [openEod, setOpenEod] = useState<IEodSubmission | null>(null);

  const overview = d.stats?.overview;
  const compliance = d.stats?.eodCompliance;
  const missing = compliance?.missingToday ?? overview?.missingEodsToday ?? 0;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-6 py-4 md:py-6">
        {/* Header */}
        <div className="px-4 lg:px-6">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {d.user?.name ? `Welcome back, ${d.user.name}. ` : ''}
            How your VAs and clients are doing today
          </p>
        </div>

        {/* Today at a glance */}
        <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
          <DashboardStatCard
            label="Active assignments"
            value={overview?.activeAssignments ?? 0}
            icon={UsersIcon}
            isLoading={d.loadingStats}
            to="/am/assignments"
          >
            {overview?.onHoldAssignments ?? 0} on hold
          </DashboardStatCard>

          <DashboardStatCard
            label="Reports today"
            value={`${compliance?.submittedToday ?? 0} of ${compliance?.totalActive ?? 0}`}
            icon={missing > 0 ? AlertTriangleIcon : CheckCircle2Icon}
            valueClassName={missing > 0 ? 'text-status-warning' : ''}
            isLoading={d.loadingStats}
            to="/am/eod-reports"
          >
            {missing > 0
              ? `${missing} still to report`
              : 'Everyone has reported'}
          </DashboardStatCard>

          <DashboardStatCard
            label="Hours this week"
            value={`${d.stats?.weeklyWorkHours.totalHours ?? 0}h`}
            icon={ClockIcon}
            isLoading={d.loadingStats}
            to="/am/work-entries"
          >
            {d.stats?.weeklyWorkHours.entriesCount ?? 0} work entries logged
          </DashboardStatCard>

          <DashboardStatCard
            label="Blockers"
            value={d.blockers.length}
            icon={d.blockers.length > 0 ? MessageSquareWarningIcon : ClipboardCheckIcon}
            valueClassName={d.blockers.length > 0 ? 'text-status-warning' : ''}
            isLoading={d.loadingEods}
            to="/am/eod-reports"
          >
            Reported in the last 7 days
          </DashboardStatCard>
        </div>

        {/* What to act on */}
        <div className="px-4 lg:px-6">
          <NeedsAttentionCard prefix="/am" />
        </div>

        {/* My VAs today, and the blockers to follow up */}
        <div className="grid grid-cols-1 gap-4 px-4 @4xl/main:grid-cols-[3fr_2fr] lg:px-6">
          <TeamTodayCard rows={d.team} loading={d.loadingTeam} />
          <BlockersCard
            blockers={d.blockers}
            loading={d.loadingEods}
            onOpen={setOpenEod}
          />
        </div>
      </div>

      <EodDetailSheet
        eodId={openEod?._id ?? null}
        fallback={openEod}
        onOpenChange={open => !open && setOpenEod(null)}
      />
    </div>
  );
}
