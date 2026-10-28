import { useMemo, useState } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import {
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useAtsVAsQuery,
  useCrmVaUsersQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { addDaysToDateKey, todayString } from '@/lib/time';

import type { IWorkEntry } from '@/types/work-entry';

import { buildWorkEntryColumns } from './work-entries/columns';
import { WorkEntryDrawer } from './work-entries/WorkEntryDrawer';
import { WorkEntryFilters } from './work-entries/WorkEntryFilters';

export default function WorkEntriesPage() {
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
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<IWorkEntry | null>(null);

  // AM scoping: only see work entries for their own assignments
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
    data: allEntries = [],
    isLoading,
    isError,
    error,
  } = useWorkEntriesQuery({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // For AM, client-side filter by their assignments' candidateIds/clientIds
  const scopedEntries = useMemo(() => {
    if (!isAccountManager) return allEntries;
    return allEntries.filter(
      e => amCandidateIds.has(e.candidateId) || amClientIds.has(e.clientId)
    );
  }, [allEntries, isAccountManager, amCandidateIds, amClientIds]);

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

  const columns = useMemo(
    () => buildWorkEntryColumns({ vaMap, clientMap, assignmentMap }),
    [vaMap, clientMap, assignmentMap]
  );

  // Search matches the VA, the client, the service or the task text.
  const query = search.trim().toLowerCase();
  const entries = useMemo(
    () =>
      scopedEntries.filter(e => {
        if (status !== 'all' && e.status !== status) return false;
        if (category !== 'all' && e.taskCategory !== category) return false;
        if (!query) return true;
        const va = e.candidateName || vaMap[e.candidateId] || '';
        const client = e.companyName || clientMap[e.clientId] || '';
        const service = assignmentMap[e.assignmentId] ?? '';
        return `${va} ${client} ${service} ${e.taskDescription}`
          .toLowerCase()
          .includes(query);
      }),
    [scopedEntries, status, category, query, vaMap, clientMap, assignmentMap]
  );

  function clearFilters() {
    setSearch('');
    setStatus('all');
    setCategory('all');
    setDateFrom(defaults.from);
    setDateTo(defaults.to);
  }

  const hasFilter =
    search !== '' ||
    status !== 'all' ||
    category !== 'all' ||
    dateFrom !== defaults.from ||
    dateTo !== defaults.to;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Work Entries
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAccountManager
                ? 'Work entries for your assigned VAs and clients'
                : 'All VA work entries across clients'}
            </p>
          </div>

          <WorkEntryFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            category={category}
            onCategoryChange={setCategory}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            hasFilter={hasFilter}
            onClear={clearFilters}
            recordCount={entries.length}
          />

          <DataTable
            columns={columns}
            data={entries}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRowClick={setSelected}
          />
        </div>
      </div>

      <WorkEntryDrawer
        entry={selected}
        vaName={
          selected
            ? selected.candidateName ||
              vaMap[selected.candidateId] ||
              selected.candidateId
            : ''
        }
        clientName={
          selected
            ? selected.companyName ||
              clientMap[selected.clientId] ||
              selected.clientId
            : ''
        }
        service={selected ? assignmentMap[selected.assignmentId] : undefined}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
