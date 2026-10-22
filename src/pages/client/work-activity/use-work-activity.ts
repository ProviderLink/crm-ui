import { useMemo, useState } from 'react';

import {
  useAllAssignmentsQuery,
  useEodSubmissionsQuery,
  useHiredVasForClientQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
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

  const workColumns = useMemo(
    () => buildWorkColumns(vaMap, assignmentMap),
    [vaMap, assignmentMap]
  );
  const eodColumns = useMemo(
    () => buildEodColumns(vaMap, assignmentMap),
    [vaMap, assignmentMap]
  );

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  const filteredEntries = useMemo(
    () =>
      allEntries.filter(e => {
        if (assignmentFilter !== 'all' && e.assignmentId !== assignmentFilter)
          return false;
        if (dateFrom && e.entryDate < dateFrom) return false;
        if (dateTo && e.entryDate > dateTo) return false;
        return true;
      }),
    [allEntries, dateFrom, dateTo, assignmentFilter]
  );

  const filteredEods = useMemo(
    () =>
      allEods.filter(e => {
        if (assignmentFilter !== 'all' && e.assignmentId !== assignmentFilter)
          return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        return true;
      }),
    [allEods, dateFrom, dateTo, assignmentFilter]
  );

  function clearFilters() {
    setDateFrom('');
    setDateTo('');
    setAssignmentFilter('all');
  }

  const hasActiveFilters =
    dateFrom !== '' || dateTo !== '' || assignmentFilter !== 'all';
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
    workColumns,
    eodColumns,
    filteredEntries,
    filteredEods,
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
