import { useMemo, useState } from 'react';

import { useAllAssignmentsQuery, useEodSubmissionsQuery } from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { useDateRange } from '@/hooks/use-date-range';
import { useReportExport } from '@/hooks/use-report-export';
import {
  useClientNames,
  useServiceNames,
  useVaNames,
} from '@/hooks/use-name-maps';
import type { IEodSubmission } from '@/types/eod-submission';

export function useEodReports() {
  const user = useAppSelector(s => s.auth.user);
  const isAccountManager = user?.role === 'account_manager';

  // The default window is the last 30 days; "Clear" returns to it.
  const range = useDateRange();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = range;
  const [search, setSearch] = useState('');
  const [selectedEodId, setSelectedEodId] = useState<string | null>(null);
  const [selectedEodFallback, setSelectedEodFallback] =
    useState<IEodSubmission | null>(null);

  const reportExport = useReportExport({ dateFrom, dateTo });

  // AM scoping: only see EODs for their own assignments
  const { data: amAssignments = [] } = useAllAssignmentsQuery(
    isAccountManager ? user?.id : undefined
  );
  const amCandidateIds = useMemo(
    () => new Set(amAssignments.map(a => a.candidateId).filter(Boolean)),
    [amAssignments]
  );
  const amClientIds = useMemo(
    () => new Set(amAssignments.map(a => a.clientId).filter(Boolean)),
    [amAssignments]
  );

  const {
    data: allEods = [],
    isLoading,
    isError,
    error,
  } = useEodSubmissionsQuery({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // For AM, client-side filter by their assignments' candidateIds/clientIds
  const scopedEods = useMemo(() => {
    if (!isAccountManager) return allEods;
    return allEods.filter(
      e => amCandidateIds.has(e.candidateId) || amClientIds.has(e.clientId)
    );
  }, [allEods, isAccountManager, amCandidateIds, amClientIds]);

  const { data: assignments = [] } = useAllAssignmentsQuery(
    isAccountManager ? user?.id : undefined
  );
  const vaMap = useVaNames();
  const clientMap = useClientNames();
  const assignmentMap = useServiceNames(assignments);

  // Search matches the VA, the client or the service type, case-insensitively.
  const query = search.trim().toLowerCase();
  const eods = useMemo(() => {
    if (!query) return scopedEods;
    return scopedEods.filter(e => {
      const va = e.candidateName || vaMap[e.candidateId] || '';
      const client = e.companyName || clientMap[e.clientId] || '';
      const service = assignmentMap[e.assignmentId] ?? '';
      return `${va} ${client} ${service}`.toLowerCase().includes(query);
    });
  }, [scopedEods, query, vaMap, clientMap, assignmentMap]);

  function clearFilters() {
    setSearch('');
    range.reset();
  }

  const hasFilter =
    search !== '' || range.isChanged;

  return {
    isAccountManager,
    eods,
    isLoading,
    isError,
    error,
    vaMap,
    clientMap,
    assignmentMap,
    search,
    setSearch,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    clearFilters,
    hasFilter,
    selectedEodId,
    setSelectedEodId,
    selectedEodFallback,
    setSelectedEodFallback,
    exportFormat: reportExport.format,
    setExportFormat: reportExport.setFormat,
    exporting: reportExport.exporting,
    exportError: reportExport.error,
    exportRangeValid: reportExport.rangeValid,
    handleExport: () => reportExport.run('eod'),
  };
}
