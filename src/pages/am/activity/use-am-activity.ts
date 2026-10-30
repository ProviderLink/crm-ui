import { useMemo, useState } from 'react';

import {
  useAllAssignmentsQuery,
  useEodSubmissionsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { addDaysToDateKey, todayString } from '@/lib/time';

import { hasBlocker } from '../dashboard/use-am-dashboard';

/**
 * Work entries and daily reports of the manager's own VAs. The backend already
 * limits every list to this manager's assignments; the names come from the
 * same assignments, so no admin-only list is needed.
 */
export function useAmActivity() {
  const user = useAppSelector(s => s.auth.user);
  const { data: assignments = [] } = useAllAssignmentsQuery(user?.id);

  // The default window is the last 30 days; "Clear" returns to it.
  const [defaults] = useState(() => ({
    from: addDaysToDateKey(todayString(), -30),
    to: todayString(),
  }));
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [search, setSearch] = useState('');
  const [assignmentId, setAssignmentId] = useState('all');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [blockersOnly, setBlockersOnly] = useState(false);

  const range = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };
  const {
    data: allEntries = [],
    isLoading: loadingEntries,
    isError: entriesError,
    error: entriesErr,
  } = useWorkEntriesQuery(range);
  const {
    data: allEods = [],
    isLoading: loadingEods,
    isError: eodsError,
    error: eodsErr,
  } = useEodSubmissionsQuery(range);

  const vaMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of assignments) if (a.candidateName) m[a.candidateId] = a.candidateName;
    return m;
  }, [assignments]);
  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of assignments) if (a.companyName) m[a.clientId] = a.companyName;
    return m;
  }, [assignments]);
  const assignmentMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of assignments) m[a._id] = a.serviceType ?? 'VA Service';
    return m;
  }, [assignments]);

  // Search matches the VA, the client, the service or the task text.
  const query = search.trim().toLowerCase();
  const matches = (
    candidateId: string,
    clientId: string,
    assignment: string,
    text: string
  ) =>
    !query ||
    `${vaMap[candidateId] ?? ''} ${clientMap[clientId] ?? ''} ${assignmentMap[assignment] ?? ''} ${text}`
      .toLowerCase()
      .includes(query);

  const entries = useMemo(
    () =>
      allEntries.filter(e => {
        if (assignmentId !== 'all' && e.assignmentId !== assignmentId)
          return false;
        if (status !== 'all' && e.status !== status) return false;
        if (category !== 'all' && e.taskCategory !== category) return false;
        return matches(
          e.candidateId,
          e.clientId,
          e.assignmentId,
          `${e.candidateName ?? ''} ${e.companyName ?? ''} ${e.taskDescription}`
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEntries, assignmentId, status, category, query, vaMap, clientMap, assignmentMap]
  );

  const eods = useMemo(
    () =>
      allEods.filter(e => {
        if (assignmentId !== 'all' && e.assignmentId !== assignmentId)
          return false;
        if (blockersOnly && !hasBlocker(e)) return false;
        const tasks =
          e.workEntries && e.workEntries.length > 0
            ? e.workEntries.map(w => w.task).join(' ')
            : (e.summaryOfWork ?? '');
        return matches(
          e.candidateId,
          e.clientId,
          e.assignmentId,
          `${e.candidateName ?? ''} ${e.companyName ?? ''} ${tasks}`
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEods, assignmentId, blockersOnly, query, vaMap, clientMap, assignmentMap]
  );

  function clearFilters() {
    setSearch('');
    setAssignmentId('all');
    setStatus('all');
    setCategory('all');
    setBlockersOnly(false);
    setDateFrom(defaults.from);
    setDateTo(defaults.to);
  }

  const hasFilter =
    search !== '' ||
    assignmentId !== 'all' ||
    status !== 'all' ||
    category !== 'all' ||
    blockersOnly ||
    dateFrom !== defaults.from ||
    dateTo !== defaults.to;

  return {
    assignments,
    entries,
    eods,
    isLoading: loadingEntries || loadingEods,
    entriesError,
    entriesErr: entriesErr as Error | null,
    eodsError,
    eodsErr: eodsErr as Error | null,
    vaMap,
    clientMap,
    assignmentMap,
    search,
    setSearch,
    assignmentId,
    setAssignmentId,
    status,
    setStatus,
    category,
    setCategory,
    blockersOnly,
    setBlockersOnly,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    clearFilters,
    hasFilter,
    blockerCount: eods.filter(hasBlocker).length,
  };
}
