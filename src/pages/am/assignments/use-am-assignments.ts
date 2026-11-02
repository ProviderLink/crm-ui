import { useMemo } from 'react';

import {
  useAllAssignmentsQuery,
  useClientAccountsQuery,
  useCompanyDay,
  useEodSubmissionsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { isReportDue } from '@/lib/compliance';
import { addDaysToDateKey, weekStartOfDateKey } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

import { hasBlocker } from '../dashboard/use-am-dashboard';

export type AssignmentRow = {
  assignment: IAssignment;
  vaName: string;
  clientName: string;
  service: string;
  /** A report is expected today: active, started, and a working day. */
  reportDue: boolean;
  submittedToday: boolean;
  weekHours: number;
  lastReport: string | null;
  blocker: boolean;
  health: string | null;
};

const BLOCKER_DAYS = 7;

/** The manager's assignments with today's report, week and health alongside. */
export function useAmAssignments() {
  const user = useAppSelector(s => s.auth.user);
  const { today } = useCompanyDay();
  const weekStart = weekStartOfDateKey(today);

  const assignmentsQuery = useAllAssignmentsQuery(user?.id);
  const eodsQuery = useEodSubmissionsQuery({
    dateFrom: addDaysToDateKey(today, -30),
  });
  const workQuery = useWorkEntriesQuery({ dateFrom: weekStart });
  const { data: assignments = [], isLoading: loadingAssignments } =
    assignmentsQuery;
  const { data: eods = [], isLoading: loadingEods } = eodsQuery;
  const { data: work = [], isLoading: loadingWork } = workQuery;
  const { data: clientAccounts = [] } = useClientAccountsQuery();

  const rows = useMemo<AssignmentRow[]>(() => {
    const health = new Map(
      clientAccounts.map(c => [c.clientId, c.healthStatus])
    );
    const blockerFrom = addDaysToDateKey(today, -BLOCKER_DAYS);
    return assignments.map(a => {
      const own = eods.filter(e => e.assignmentId === a._id);
      const weekMinutes = work
        .filter(w => w.assignmentId === a._id && w.entryDate >= weekStart)
        .reduce((sum, w) => sum + w.timeSpent, 0);
      return {
        assignment: a,
        vaName: a.candidateName || 'VA',
        clientName: a.companyName || '',
        service: a.serviceType ?? 'VA Service',
        reportDue: isReportDue(a, today),
        submittedToday: own.some(e => e.date === today),
        weekHours: weekMinutes / 60,
        lastReport:
          own.map(e => e.date).sort((x, y) => (x < y ? 1 : -1))[0] ?? null,
        blocker: own.some(e => e.date >= blockerFrom && hasBlocker(e)),
        health: health.get(a.clientId) ?? null,
      };
    });
  }, [assignments, eods, work, clientAccounts, today, weekStart]);

  return {
    rows,
    today,
    isLoading: loadingAssignments || loadingEods || loadingWork,
    isError: assignmentsQuery.isError || eodsQuery.isError || workQuery.isError,
    error: assignmentsQuery.error ?? eodsQuery.error ?? workQuery.error,
  };
}
