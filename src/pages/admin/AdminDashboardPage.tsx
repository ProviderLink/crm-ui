import {
  AlertTriangleIcon,
  ClipboardXIcon,
  UserCheckIcon,
  UsersIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import {
  useAtsClientsQuery,
  useAtsVAsQuery,
  useDashboardStatsQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';

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

  // Use backend per-VA breakdown if available
  const perVABreakdown = stats?.perVABreakdown ?? [];
  const breakdown: VABreakdownRow[] = perVABreakdown.map(r => ({
    vaId: r.vaId,
    vaName: r.vaName,
    count: r.entriesCount,
    hours: r.totalHours,
    tasks: r.tasksCompleted,
  }));

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Stat cards */}
        <div className="*:data-[slot=card]:@xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 lg:px-6">
          <StatCard
            label="Active Assignments"
            value={overview?.activeAssignments ?? 0}
            isLoading={loadingStats}
            icon={UsersIcon}
            footer="VA–client assignments currently active"
          />
          <StatCard
            label="Entries Today"
            value={overview?.totalWorkEntriesToday ?? 0}
            isLoading={loadingStats}
            icon={UserCheckIcon}
            footer="Work entries logged across all VAs today"
          />
          <StatCard
            label="EODs Submitted Today"
            value={overview?.totalEodSubmissionsToday ?? 0}
            isLoading={loadingStats}
            icon={ClipboardXIcon}
            footer="End-of-day reports submitted today"
          />
          <StatCard
            label="Missing EODs Today"
            value={overview?.missingEodsToday ?? 0}
            isLoading={loadingStats}
            icon={AlertTriangleIcon}
            footer="Active assignments with no EOD yet"
            valueClassName={
              !loadingStats && (overview?.missingEodsToday ?? 0) > 0
                ? 'text-destructive'
                : ''
            }
          />
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 px-4 lg:px-6">
          <Button asChild>
            <Link
              to={isAccountManager ? '/am/assignments' : '/admin/assignments'}
            >
              <UsersIcon className="size-4" />
              Manage Assignments
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={isAccountManager ? '/am/accounts' : '/admin/accounts'}>
              View Accounts
            </Link>
          </Button>
        </div>

        {/* Per-VA breakdown — chart + table */}
        {!loading && breakdown.length > 0 && (
          <div className="px-4 lg:px-6">
            <VaActivityCard breakdown={breakdown} />
          </div>
        )}

        <div className="px-4 lg:px-6">
          <ExportDataCard />
        </div>
      </div>
    </div>
  );
}
