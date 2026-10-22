import {
  useEodContextQuery,
  useEodSubmissionsQuery,
  useHiredVasForClientQuery,
  useMyAllAssignmentsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { addDaysToDateKey, todayString, weekdayOfDateKey } from '@/lib/time';

export function useDashboardData() {
  const user = useAppSelector(s => s.auth.user);
  // Compliance is measured against the company business day so VAs in any
  // timezone are judged on the same calendar.
  const { data: eodContext } = useEodContextQuery();
  const today = eodContext?.dateKey ?? todayString();
  const weekStart = (() => {
    const dow = weekdayOfDateKey(today);
    return addDaysToDateKey(today, -(dow === 0 ? 6 : dow - 1));
  })();
  const sevenDaysAgo = addDaysToDateKey(today, -7);

  const { data: allAssignments = [], isLoading: loadingAssignments } =
    useMyAllAssignmentsQuery();
  const { data: hiredVAs = [] } = useHiredVasForClientQuery(
    user?.clientRef ?? undefined
  );
  // Only this week's hours are shown, so only ask for this week.
  const { data: workAll = [], isLoading: loadingWork } = useWorkEntriesQuery({
    dateFrom: weekStart,
  });
  const { data: eods = [], isLoading: loadingEods } = useEodSubmissionsQuery();

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

  // EOD compliance last 7 working days
  const activeCandidateIds = new Set(activeAssignments.map(a => a.candidateId));
  const recentEods = eods.filter(e => e.date >= sevenDaysAgo);
  const recentEodSet = new Set(
    recentEods.map(e => `${e.candidateId}::${e.date}`)
  );
  const workingDaysLast7 = Array.from({ length: 7 }, (_, i) =>
    addDaysToDateKey(today, -i)
  ).filter(d => {
    const day = weekdayOfDateKey(d);
    return day >= 1 && day <= 5 && d <= today;
  });
  const expectedEods = activeCandidateIds.size * workingDaysLast7.length;
  const submittedEods = workingDaysLast7.reduce(
    (sum, day) =>
      sum +
      [...activeCandidateIds].filter(id => recentEodSet.has(`${id}::${day}`))
        .length,
    0
  );
  const eodCompliance =
    expectedEods > 0 ? Math.round((submittedEods / expectedEods) * 100) : null;

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
