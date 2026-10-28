import { useMemo, useState } from 'react';

import {
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useAtsVAsQuery,
  useCrmVaUsersQuery,
  useEodSubmissionsQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { exportReport, type ExportFormat } from '@/services/reports.service';
import type { IEodSubmission } from '@/types/eod-submission';
import { addDaysToDateKey, todayString } from '@/lib/time';

export function useEodReports() {
  const user = useAppSelector(s => s.auth.user);
  const isAccountManager = user?.role === 'account_manager';

  // The default window is the last 30 days; "Clear" returns to it.
  const [defaults] = useState(() => ({
    from: addDaysToDateKey(todayString(), -30),
    to: todayString(),
  }));
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [search, setSearch] = useState('');
  const [selectedEodId, setSelectedEodId] = useState<string | null>(null);
  const [selectedEodFallback, setSelectedEodFallback] =
    useState<IEodSubmission | null>(null);

  // Export uses the same date range as the table filters above, so the
  // header only shows one date range.
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportRangeValid =
    dateFrom !== '' && dateTo !== '' && dateFrom <= dateTo;

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await exportReport('eod', dateFrom, dateTo, exportFormat);
    } catch {
      setExportError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

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

  const { data: crmVAs = [] } = useCrmVaUsersQuery();
  const { data: atsVAs = [] } = useAtsVAsQuery();
  const { data: atsClients = [] } = useAtsClientsQuery();
  const { data: assignments = [] } = useAllAssignmentsQuery(
    isAccountManager ? user?.id : undefined
  );

  // Build VA name map: primary source = ATS candidates (candidateId matches ATS _id),
  // fallback = CRM VA users by candidateRef or _id
  const vaMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const v of atsVAs) {
      m[v.id] = `${v.firstName} ${v.lastName}`;
    }
    for (const v of crmVAs) {
      const name = `${v.firstName} ${v.lastName}`;
      if (v.candidateRef && !m[v.candidateRef]) m[v.candidateRef] = name;
      if (v._id && !m[v._id]) m[v._id] = name;
    }
    return m;
  }, [atsVAs, crmVAs]);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of atsClients) m[c.id] = c.companyName;
    return m;
  }, [atsClients]);

  const assignmentMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of assignments) m[a._id] = a.serviceType ?? 'VA Service';
    return m;
  }, [assignments]);

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
    setDateFrom(defaults.from);
    setDateTo(defaults.to);
  }

  const hasFilter =
    search !== '' || dateFrom !== defaults.from || dateTo !== defaults.to;

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
    exportFormat,
    setExportFormat,
    exporting,
    exportError,
    exportRangeValid,
    handleExport,
  };
}
