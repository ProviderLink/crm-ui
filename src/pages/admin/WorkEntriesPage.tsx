import { DatePickerField } from '@/components/ui/date-picker-field';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useAtsVAsQuery,
  useCrmClientUsersQuery,
  useCrmVaUsersQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { addDaysToDateKey, todayString } from '@/lib/time';

import { buildWorkEntryColumns } from './work-entries/columns';

export default function WorkEntriesPage() {
  const user = useAppSelector(s => s.auth.user);
  const isAccountManager = user?.role === 'account_manager';

  const [dateFrom, setDateFrom] = useState(() =>
    addDaysToDateKey(todayString(), -30)
  );
  const [dateTo, setDateTo] = useState(() => todayString());
  const [vaFilter, setVaFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

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

  const effectiveCandidateId =
    vaFilter !== 'all' ? vaFilter : isAccountManager ? undefined : undefined;

  const effectiveClientId =
    clientFilter !== 'all'
      ? clientFilter
      : isAccountManager
        ? undefined
        : undefined;

  const {
    data: allEntries = [],
    isLoading,
    isError,
    error,
  } = useWorkEntriesQuery({
    candidateId: effectiveCandidateId,
    clientId: effectiveClientId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // For AM, client-side filter by their assignments' candidateIds/clientIds
  const entries = useMemo(() => {
    if (!isAccountManager) return allEntries;
    return allEntries.filter(
      e => amCandidateIds.has(e.candidateId) || amClientIds.has(e.clientId)
    );
  }, [allEntries, isAccountManager, amCandidateIds, amClientIds]);

  const { data: crmVAs = [] } = useCrmVaUsersQuery();
  const { data: atsVAs = [] } = useAtsVAsQuery();
  const { data: atsClients = [] } = useAtsClientsQuery();
  const { data: crmClients = [] } = useCrmClientUsersQuery();
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

  const crmClientRefs = useMemo(
    () => new Set(crmClients.map(c => c.clientRef).filter(Boolean)),
    [crmClients]
  );
  const filteredClients = useMemo(
    () => atsClients.filter(c => crmClientRefs.has(c.id)),
    [atsClients, crmClientRefs]
  );

  // AM: restrict VA/client dropdowns to their assignments only
  const displayVAs = useMemo(() => {
    if (!isAccountManager) return atsVAs;
    const amVaIds = new Set(amAssignments.map(a => a.candidateId));
    return atsVAs.filter(v => amVaIds.has(v.id));
  }, [atsVAs, isAccountManager, amAssignments]);

  const displayClients = useMemo(() => {
    if (!isAccountManager) return filteredClients;
    const amClientIdsSet = new Set(amAssignments.map(a => a.clientId));
    return filteredClients.filter(c => amClientIdsSet.has(c.id));
  }, [filteredClients, isAccountManager, amAssignments]);

  const assignmentMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of assignments) m[a._id] = a.serviceType ?? 'VA Service';
    return m;
  }, [assignments]);

  const columns = useMemo(
    () => buildWorkEntryColumns({ vaMap, clientMap, assignmentMap }),
    [vaMap, clientMap, assignmentMap]
  );

  function clearFilters() {
    setDateFrom('');
    setDateTo('');
    setVaFilter('all');
    setClientFilter('all');
  }

  const hasFilter =
    dateFrom !== '' ||
    dateTo !== '' ||
    vaFilter !== 'all' ||
    clientFilter !== 'all';

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

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Select value={vaFilter} onValueChange={setVaFilter}>
              <SelectTrigger className="rounded-xl border-input h-8 text-sm w-44">
                <SelectValue placeholder="All VAs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All VAs</SelectItem>
                {displayVAs.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.firstName} {v.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="rounded-xl border-input h-8 text-sm w-44">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {displayClients.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From</span>
              <DatePickerField
                value={dateFrom}
                onChange={v => setDateFrom(v)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To</span>
              <DatePickerField value={dateTo} onChange={v => setDateTo(v)} />
            </div>

            {hasFilter && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {entries.length} records
            </span>
          </div>

          <DataTable
            columns={columns}
            data={entries}
            isLoading={isLoading}
            isError={isError}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
