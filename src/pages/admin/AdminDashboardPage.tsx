import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  ClipboardCheckIcon,
  UsersIcon,
} from 'lucide-react';
import { ErrorNotice } from '@/components/shared/ErrorNotice';
import { Page, PageSection } from '@/components/shared/PageLayout';
import { useDashboardStatsQuery } from '@/hooks/queries';

import { DashboardStatCard } from '@/components/shared/DashboardStatCard';
import { ExportDataCard } from './admin-dashboard/ExportDataCard';
import { NeedsAttentionCard } from '@/features/dashboard/NeedsAttentionCard';
import {
  VaActivityCard,
  type VABreakdownRow,
} from './admin-dashboard/VaActivityCard';

export default function AdminDashboardPage() {
  const prefix = '/admin';

  const {
    data: stats,
    isLoading: loadingStats,
    error: statsError,
  } = useDashboardStatsQuery();

  const overview = stats?.overview;
  const compliance = stats?.eodCompliance;
  const missing = overview?.missingEodsToday ?? 0;

  const breakdown: VABreakdownRow[] = (stats?.perVABreakdown ?? []).map(r => ({
    vaId: r.vaId,
    vaName: r.vaName,
    count: r.entriesCount,
    hours: r.totalHours,
    tasks: r.tasksCompleted,
  }));

  return (
    <Page variant="dashboard">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            How every VA is doing today
          </p>
        </div>
      </div>

      {statsError && (
        <PageSection>
          <ErrorNotice error={statsError} />
        </PageSection>
      )}

      {/* Today at a glance */}
      <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
        <DashboardStatCard
          label="Active assignments"
          value={overview?.activeAssignments ?? 0}
          icon={UsersIcon}
          isLoading={loadingStats}
          to={`${prefix}/assignments`}
        >
          {overview?.onHoldAssignments ?? 0} on hold ·{' '}
          {overview?.endedAssignments ?? 0} ended
        </DashboardStatCard>

        <DashboardStatCard
          label="Entries today"
          value={overview?.totalWorkEntriesToday ?? 0}
          icon={ClockIcon}
          isLoading={loadingStats}
          to={`${prefix}/work-entries`}
        >
          {stats?.weeklyWorkHours.totalHours ?? 0}h logged this week
        </DashboardStatCard>

        <DashboardStatCard
          label="EODs submitted today"
          value={overview?.totalEodSubmissionsToday ?? 0}
          icon={ClipboardCheckIcon}
          isLoading={loadingStats}
          to={`${prefix}/eod-reports`}
        >
          {compliance?.submittedToday ?? 0} of {compliance?.totalActive ?? 0}{' '}
          active assignments
        </DashboardStatCard>

        <DashboardStatCard
          label="Missing EODs today"
          value={missing}
          icon={missing > 0 ? AlertTriangleIcon : CheckCircle2Icon}
          valueClassName={missing > 0 ? 'text-status-error' : ''}
          isLoading={loadingStats}
          to={`${prefix}/eod-reports`}
        >
          {missing > 0
            ? 'Active assignments with no EOD yet'
            : 'Everyone has reported today'}
        </DashboardStatCard>
      </div>

      {/* What to act on */}
      <PageSection>
        <NeedsAttentionCard prefix={prefix} />
      </PageSection>

      {/* VA activity */}
      <PageSection>
        {!loadingStats && breakdown.length > 0 ? (
          <VaActivityCard
            breakdown={breakdown}
            scorecardsPath={`${prefix}/scorecards`}
          />
        ) : (
          !loadingStats && (
            <div className="flex min-h-40 items-center justify-center rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
              No work has been logged in the last 7 days.
            </div>
          )
        )}
      </PageSection>

      <PageSection>
        <ExportDataCard />
      </PageSection>
    </Page>
  );
}
