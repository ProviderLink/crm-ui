import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  ClipboardCheckIcon,
  UsersIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  useAtsClientsQuery,
  useAtsVAsQuery,
  useDashboardStatsQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';

import { DashboardStatCard } from './admin-dashboard/DashboardStatCard';
import { ExportDataCard } from './admin-dashboard/ExportDataCard';
import {
  VaActivityCard,
  type VABreakdownRow,
} from './admin-dashboard/VaActivityCard';

export default function AdminDashboardPage() {
  const user = useAppSelector(s => s.auth.user);
  const isAccountManager = user?.role === 'account_manager';

  const { data: stats, isLoading: loadingStats } = useDashboardStatsQuery();
  const { isLoading: loadingVAs } = useAtsVAsQuery();
  const { isLoading: loadingClients } = useAtsClientsQuery();
  const loading = loadingVAs || loadingClients;

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
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-6 py-4 md:py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isAccountManager
                ? 'How your VAs are doing today'
                : 'How every VA is doing today'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={isAccountManager ? '/am/accounts' : '/admin/accounts'}>
                View Accounts
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link
                to={isAccountManager ? '/am/assignments' : '/admin/assignments'}
              >
                <UsersIcon className="size-4" />
                Manage Assignments
              </Link>
            </Button>
          </div>
        </div>

        {/* Today at a glance */}
        <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
          <DashboardStatCard
            label="Active assignments"
            value={overview?.activeAssignments ?? 0}
            icon={UsersIcon}
            isLoading={loadingStats}
          >
            {overview?.onHoldAssignments ?? 0} on hold ·{' '}
            {overview?.endedAssignments ?? 0} ended
          </DashboardStatCard>

          <DashboardStatCard
            label="Entries today"
            value={overview?.totalWorkEntriesToday ?? 0}
            icon={ClockIcon}
            isLoading={loadingStats}
          >
            {stats?.weeklyWorkHours.totalHours ?? 0}h logged this week
          </DashboardStatCard>

          <DashboardStatCard
            label="EODs submitted today"
            value={overview?.totalEodSubmissionsToday ?? 0}
            icon={ClipboardCheckIcon}
            isLoading={loadingStats}
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
          >
            {missing > 0
              ? 'Active assignments with no EOD yet'
              : 'Everyone has reported today'}
          </DashboardStatCard>
        </div>

        {/* VA activity */}
        <div className="px-4 lg:px-6">
          {!loading && breakdown.length > 0 ? (
            <VaActivityCard breakdown={breakdown} />
          ) : (
            !loading && (
              <div className="flex min-h-40 items-center justify-center rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                No work has been logged in the last 7 days.
              </div>
            )
          )}
        </div>

        <div className="px-4 lg:px-6">
          <ExportDataCard />
        </div>
      </div>
    </div>
  );
}
