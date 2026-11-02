import {
  useCompanyDay,
  useEodSubmissionsQuery,
  useHiredVasForClientQuery,
  useMyAllAssignmentsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { eodComplianceRate } from '@/lib/compliance';
import { addDaysToDateKey, weekdayOfDateKey } from '@/lib/time';

export function useDashboardData() {
  const user = useAppSelector(s => s.auth.user);
  // Compliance is measured against the company business day so VAs in any
  // timezone are judged on the same calendar.
  const { today } = useCompanyDay();
  const weekStart = (() => {
    const dow = weekdayOfDateKey(today);
    return addDaysToDateKey(today, -(dow === 0 ? 6 : dow - 1));
  })();

  const assignmentsQuery = useMyAllAssignmentsQuery();
  const { data: allAssignments = [], isLoading: loadingAssignments } =
    assignmentsQuery;
  const { data: hiredVAs = [] } = useHiredVasForClientQuery(
    user?.clientRef ?? undefined
  );
  // Only this week's hours are shown, so only ask for this week.
  const workQuery = useWorkEntriesQuery({ dateFrom: weekStart });
  // Enough history for the latest report of each VA, the recent list and
  // the 7-day rate, without loading every report ever filed.
  const eodsQuery = useEodSubmissionsQuery({
    dateFrom: addDaysToDateKey(today, -90),
  });
  const { data: workAll = [], isLoading: loadingWork } = workQuery;
  const { data: eods = [], isLoading: loadingEods } = eodsQuery;

  // Build VA name map from hired-vas endpoint (client-scoped, always accessible)
  const vaNameMap: Record<string, string> = {};
  for (const v of hiredVAs) vaNameMap[v.id] = `${v.firstName} ${v.lastName}`;

  const activeAssignments = allAssignments.filter(a => a.status === 'active');
  const onHoldAssignments = allAssignments.filter(a => a.status === 'on_hold');
  const endedAssignments = allAssignments.filter(a => a.status === 'ended');
  const visibleAssignments = [...activeAssignments, ...onHoldAssignments];

  // This week's total hours across all VAs
  const weekHours =
    workAll
      .filter(e => e.entryDate.slice(0, 10) >= weekStart)
      .reduce((sum, e) => sum + e.timeSpent, 0) / 60;

  // Share of the reports due on working days in the last 7 days that were
  // filed (a VA is not owed a report before the assignment starts).
  const eodCompliance = eodComplianceRate(activeAssignments, eods, today);

  // Per-VA helpers
  function vaWeekHours(candidateId: string) {
    return (
      workAll
        .filter(
          e =>
            e.candidateId === candidateId &&
            e.entryDate.slice(0, 10) >= weekStart
        )
        .reduce((sum, e) => sum + e.timeSpent, 0) / 60
    );
  }

  function vaLastEod(candidateId: string) {
    return (
      [...eods]
        .filter(e => e.candidateId === candidateId)
        .sort((a, b) => (b.date > a.date ? 1 : -1))[0]?.date ?? null
    );
  }

  const sortedEods = [...eods].sort((a, b) => (b.date > a.date ? 1 : -1));
  const recentEodsList = sortedEods.slice(0, 6);
  const lastEodDate = sortedEods[0]?.date ?? null;

  return {
    user,
    loadingAssignments,
    loadingWork,
    loadingEods,
    error: assignmentsQuery.error ?? workQuery.error ?? eodsQuery.error,
    activeAssignments,
    onHoldAssignments,
    endedAssignments,
    visibleAssignments,
    weekHours,
    eodCompliance,
    vaNameMap,
    vaWeekHours,
    vaLastEod,
    recentEodsList,
    lastEodDate,
  };
}
