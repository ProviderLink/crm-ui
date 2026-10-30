import { useMemo } from 'react';

import {
  useAllAssignmentsQuery,
  useDashboardStatsQuery,
  useEodContextQuery,
  useEodSubmissionsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import {
  addDaysToDateKey,
  todayString,
  weekStartOfDateKey,
} from '@/lib/time';
import type { IEodSubmission } from '@/types/eod-submission';

export type TeamRow = {
  id: string;
  vaName: string;
  clientName: string;
  service: string;
  onHold: boolean;
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
  const { data: eodContext } = useEodContextQuery();
  const today = eodContext?.dateKey ?? todayString();
  const weekStart = weekStartOfDateKey(today);

  const { data: stats, isLoading: loadingStats } = useDashboardStatsQuery();
  const { data: assignments = [], isLoading: loadingAssignments } =
    useAllAssignmentsQuery(user?.id);
  const { data: eods = [], isLoading: loadingEods } = useEodSubmissionsQuery({
    dateFrom: addDaysToDateKey(today, -30),
  });
  const { data: work = [], isLoading: loadingWork } = useWorkEntriesQuery({
    dateFrom: weekStart,
  });

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
          submittedToday: own.some(e => e.date === today),
          weekHours: weekMinutes / 60,
          lastReport,
        };
      });
    // Whoever still owes a report today comes first.
    return rows.sort(
      (a, b) =>
        Number(a.onHold) - Number(b.onHold) ||
        Number(a.submittedToday) - Number(b.submittedToday) ||
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
  };
}
