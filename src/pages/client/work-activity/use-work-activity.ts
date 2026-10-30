import { useMemo, useState } from 'react';

import {
  useAllAssignmentsQuery,
  useEodSubmissionsQuery,
  useHiredVasForClientQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { addDaysToDateKey, todayString } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

import { buildEodColumns } from './eod-columns';
import { buildWorkColumns } from './work-columns';

export function useWorkActivity() {
  const user = useAppSelector(s => s.auth.user);
  const { data: assignments = [], isLoading: loadingAssignments } =
    useAllAssignmentsQuery();
  const { data: allEntries = [], isLoading: loadingEntries } =
    useWorkEntriesQuery();
  const { data: allEods = [], isLoading: loadingEods } =
    useEodSubmissionsQuery();
  const { data: hiredVAs = [] } = useHiredVasForClientQuery(
    user?.clientRef ?? undefined
  );
  const isLoading = loadingAssignments || loadingEntries || loadingEods;

  const vaMap = useMemo(() => {
    const m = new Map<string, string>();
    hiredVAs.forEach(v => m.set(v.id, `${v.firstName} ${v.lastName}`));
    return m;
  }, [hiredVAs]);

  const assignmentMap = useMemo(() => {
    const m = new Map<string, string>();
    assignments.forEach(a => m.set(a._id, a.serviceType ?? 'VA Service'));
    return m;
  }, [assignments]);

  const clientMap = useMemo(() => {
    const m = new Map<string, string>();
    assignments.forEach(a => {
      if (a.companyName) m.set(a.clientId, a.companyName);
    });
    return m;
  }, [assignments]);

  const workColumns = useMemo(
    () => buildWorkColumns(vaMap, assignmentMap),
    [vaMap, assignmentMap]
  );
  const eodColumns = useMemo(
    () => buildEodColumns(vaMap, assignmentMap),
    [vaMap, assignmentMap]
  );

  // The default window is the last 30 days; "Clear" returns to it.
  const [defaults] = useState(() => ({
    from: addDaysToDateKey(todayString(), -30),
    to: todayString(),
  }));
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Search matches the VA, the service, or the task text.
  const query = search.trim().toLowerCase();
  const matches = (assignmentId: string, candidateId: string, text: string) => {
    if (!query) return true;
    const va = vaMap.get(candidateId) ?? '';
    const service = assignmentMap.get(assignmentId) ?? '';
    return `${va} ${service} ${text}`.toLowerCase().includes(query);
  };

  const filteredEntries = useMemo(
    () =>
      allEntries.filter(e => {
        if (assignmentFilter !== 'all' && e.assignmentId !== assignmentFilter)
          return false;
        if (dateFrom && e.entryDate < dateFrom) return false;
        if (dateTo && e.entryDate > dateTo) return false;
        return matches(
          e.assignmentId,
          e.candidateId,
          `${e.taskCategory} ${e.taskDescription}`
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEntries, dateFrom, dateTo, assignmentFilter, query, vaMap, assignmentMap]
  );

  const filteredEods = useMemo(
    () =>
      allEods.filter(e => {
        if (assignmentFilter !== 'all' && e.assignmentId !== assignmentFilter)
          return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        const tasks =
          e.workEntries && e.workEntries.length > 0
            ? e.workEntries.map(w => w.task).join(' ')
            : (e.summaryOfWork ?? '');
        return matches(e.assignmentId, e.candidateId, tasks);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEods, dateFrom, dateTo, assignmentFilter, query, vaMap, assignmentMap]
  );

  function clearFilters() {
    setSearch('');
    setAssignmentFilter('all');
    setDateFrom(defaults.from);
    setDateTo(defaults.to);
  }

  const hasActiveFilters =
    search !== '' ||
    assignmentFilter !== 'all' ||
    dateFrom !== defaults.from ||
    dateTo !== defaults.to;
  const multipleAssignments = assignments.length > 1;

  function assignmentLabel(a: IAssignment): string {
    const name = vaMap.get(a.candidateId);
    return name
      ? `${name} — ${a.serviceType ?? 'VA Service'}`
      : (a.serviceType ?? 'VA Service');
  }

  return {
    assignments,
    isLoading,
    vaMap,
    assignmentMap,
    clientMap,
    workColumns,
    eodColumns,
    filteredEntries,
    filteredEods,
    search,
    setSearch,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    assignmentFilter,
    setAssignmentFilter,
    clearFilters,
    hasActiveFilters,
    multipleAssignments,
    assignmentLabel,
  };
}
