import { useMemo } from 'react';

import {
  useAllAssignmentsQuery,
  useDashboardStatsQuery,
  useCompanyDay,
  useEodSubmissionsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { isReportDue } from '@/lib/compliance';
import { addDaysToDateKey, weekStartOfDateKey } from '@/lib/time';
import type { IEodSubmission } from '@/types/eod-submission';

export type TeamRow = {
  id: string;
  vaName: string;
  clientName: string;
  service: string;
  onHold: boolean;
  /** A report is expected today: active, started, and a working day. */
  reportDue: boolean;
  submittedToday: boolean;
  weekHours: number;
  lastReport: string | null;
};

/** A blocker field counts only when the VA wrote something other than "None". */
const NO_BLOCKER = /^(none|n\/a|na|no|nil|nothing|-+)\.?$/i;
export const hasBlocker = (e: IEodSubmission) => {
  const text = e.blockers?.trim();
  return !!text && !NO_BLOCKER.test(text);
};

const BLOCKER_DAYS = 7;

/**
 * Everything the account manager's dashboard shows. The backend already limits
 * every list to this manager's own assignments.
 */
export function useAmDashboard() {
  const user = useAppSelector(s => s.auth.user);
  // Business-day keys follow the company's calendar, not the device clock.
  const { today } = useCompanyDay();
  const weekStart = weekStartOfDateKey(today);

  const statsQuery = useDashboardStatsQuery();
  const assignmentsQuery = useAllAssignmentsQuery(user?.id);
  const eodsQuery = useEodSubmissionsQuery({
    dateFrom: addDaysToDateKey(today, -30),
  });
  const workQuery = useWorkEntriesQuery({ dateFrom: weekStart });
  const { data: stats, isLoading: loadingStats } = statsQuery;
  const { data: assignments = [], isLoading: loadingAssignments } =
    assignmentsQuery;
  const { data: eods = [], isLoading: loadingEods } = eodsQuery;
  const { data: work = [], isLoading: loadingWork } = workQuery;

  const team = useMemo<TeamRow[]>(() => {
    const rows = assignments
      .filter(a => a.status === 'active' || a.status === 'on_hold')
      .map(a => {
        const own = eods.filter(e => e.assignmentId === a._id);
        const lastReport =
          own.map(e => e.date).sort((x, y) => (x < y ? 1 : -1))[0] ?? null;
        const weekMinutes = work
          .filter(w => w.assignmentId === a._id && w.entryDate >= weekStart)
          .reduce((sum, w) => sum + w.timeSpent, 0);
        return {
          id: a._id,
          vaName: a.candidateName || 'VA',
          clientName: a.companyName || '',
          service: a.serviceType ?? 'VA Service',
          onHold: a.status === 'on_hold',
          reportDue: isReportDue(a, today),
          submittedToday: own.some(e => e.date === today),
          weekHours: weekMinutes / 60,
          lastReport,
        };
      });
    // Whoever still owes a report today comes first.
    return rows.sort(
      (a, b) =>
        Number(a.onHold) - Number(b.onHold) ||
        Number(!a.reportDue || a.submittedToday) -
          Number(!b.reportDue || b.submittedToday) ||
        a.vaName.localeCompare(b.vaName)
    );
  }, [assignments, eods, work, today, weekStart]);

  const blockers = useMemo(() => {
    const from = addDaysToDateKey(today, -BLOCKER_DAYS);
    return eods
      .filter(e => e.date >= from && hasBlocker(e))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [eods, today]);

  return {
    user,
    stats,
    team,
    blockers,
    loadingStats,
    loadingTeam: loadingAssignments || loadingEods || loadingWork,
    loadingEods,
    error:
      statsQuery.error ??
      assignmentsQuery.error ??
      eodsQuery.error ??
      workQuery.error,
  };
}
