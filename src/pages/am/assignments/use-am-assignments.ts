import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  useAllAssignmentsQuery,
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
import { getClientAccounts } from '@/services/client-accounts.service';
import type { IAssignment } from '@/types/assignment';

import { hasBlocker } from '../dashboard/use-am-dashboard';

export type AssignmentRow = {
  assignment: IAssignment;
  vaName: string;
  clientName: string;
  service: string;
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
  const { data: eodContext } = useEodContextQuery();
  const today = eodContext?.dateKey ?? todayString();
  const weekStart = weekStartOfDateKey(today);

  const { data: assignments = [], isLoading: loadingAssignments } =
    useAllAssignmentsQuery(user?.id);
  const { data: eods = [], isLoading: loadingEods } = useEodSubmissionsQuery({
    dateFrom: addDaysToDateKey(today, -30),
  });
  const { data: work = [], isLoading: loadingWork } = useWorkEntriesQuery({
    dateFrom: weekStart,
  });
  const { data: clientAccounts = [] } = useQuery({
    queryKey: ['client-accounts-list'],
    queryFn: getClientAccounts,
  });

  const rows = useMemo<AssignmentRow[]>(() => {
    const health = new Map(clientAccounts.map(c => [c.clientId, c.healthStatus]));
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
  };
}
