import { DatePickerField } from '@/components/ui/date-picker-field';
import type { ColumnDef } from '@tanstack/react-table';
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
  useEodSubmissionsQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import type { IEodSubmission } from '@/types/eod-submission';

export default function EodReportsPage() {
  const user = useAppSelector(s => s.auth.user);
  const isAccountManager = user?.role === 'account_manager';

  const [dateFrom, setDateFrom] = useState(
    () =>
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
  );
  const [dateTo, setDateTo] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [vaFilter, setVaFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

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
    candidateId: vaFilter !== 'all' ? vaFilter : undefined,
    clientId: clientFilter !== 'all' ? clientFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // For AM, client-side filter by their assignments' candidateIds/clientIds
  const eods = useMemo(() => {
    if (!isAccountManager) return allEods;
    return allEods.filter(
      e => amCandidateIds.has(e.candidateId) || amClientIds.has(e.clientId)
    );
  }, [allEods, isAccountManager, amCandidateIds, amClientIds]);

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

  const columns = useMemo<ColumnDef<IEodSubmission>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        size: 115,
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {getValue<string>()?.slice(0, 10)}
          </span>
        ),
      },
      {
        accessorKey: 'candidateId',
        header: 'VA',
        size: 140,
        cell: ({ row, getValue }) => (
          <span className="text-sm">
            {row.original.candidateName ||
              vaMap[getValue<string>()] ||
              getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'clientId',
        header: 'Client',
        size: 220,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">
              {row.original.companyName ||
                clientMap[row.original.clientId] ||
                row.original.clientId}
            </span>
            <span className="text-xs text-muted-foreground">
              {assignmentMap[row.original.assignmentId] ?? '—'}
            </span>
          </div>
        ),
      },
      ...(isAccountManager
        ? []
        : [
            {
              accessorKey: 'shiftStart',
              header: 'Start',
              size: 45,
              cell: ({ getValue }: any) => (
                <span className="text-sm">{getValue<string>()}</span>
              ),
            },
            {
              accessorKey: 'shiftEnd',
              header: 'End',
              size: 45,
              cell: ({ getValue }: any) => (
                <span className="text-sm">{getValue<string>()}</span>
              ),
            },
          ]),
      {
        accessorKey: 'hoursWorked',
        header: 'Hours',
        size: 30,
        meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-foreground">
            {getValue<number>()}h
          </span>
        ),
      },
      {
        accessorKey: 'summaryOfWork',
        header: 'Summary',
        enableSorting: false,
        meta: {
          fill: true,
          cellClassName: 'bg-white/[0.04] border-l border-white/[0.06]',
        },
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'pendingTasks',
        header: 'Pending Tasks',
        size: 200,
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue<string>() || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'blockers',
        header: 'Blockers',
        size: 180,
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue<string>() || '—'}
          </span>
        ),
      },
    ],
    [vaMap, clientMap, assignmentMap, isAccountManager]
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
              EOD Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAccountManager
                ? 'EOD submissions for your assigned VAs'
                : 'All VA EOD submissions across clients'}
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
              {eods.length} records
            </span>
          </div>

          <DataTable
            columns={columns}
            data={eods}
            isLoading={isLoading}
            isError={isError}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
