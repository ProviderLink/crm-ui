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
  useCrmClientUsersQuery,
  useCrmVaUsersQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import { formatMinutes } from '@/lib/time';
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry';

const STATUS_STYLES: Record<WorkEntryStatus, string> = {
  completed: 'bg-white/[0.04] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]',
  in_progress: 'bg-white/[0.04] text-[#A0A0A0] border-[rgba(255,255,255,0.08)]',
  pending: 'bg-white/[0.04] text-[#6E6E6E] border-[rgba(255,255,255,0.08)]',
};

export default function WorkEntriesPage() {
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

  const {
    data: allEntries = [],
    isLoading,
    isError,
    error,
  } = useWorkEntriesQuery({
    candidateId: vaFilter !== 'all' ? vaFilter : undefined,
    clientId: clientFilter !== 'all' ? clientFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const { data: crmVAs = [] } = useCrmVaUsersQuery();
  const { data: atsClients = [] } = useAtsClientsQuery();
  const { data: crmClients = [] } = useCrmClientUsersQuery();
  const { data: assignments = [] } = useAllAssignmentsQuery();

  const vaMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const v of crmVAs) {
      if (v.candidateRef) m[v.candidateRef] = `${v.firstName} ${v.lastName}`;
    }
    return m;
  }, [crmVAs]);

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

  const assignmentMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of assignments) m[a._id] = a.serviceType ?? 'VA Service';
    return m;
  }, [assignments]);

  const columns = useMemo<ColumnDef<IWorkEntry>[]>(
    () => [
      {
        accessorKey: 'entryDate',
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
        cell: ({ getValue }) => (
          <span className="text-sm">
            {vaMap[getValue<string>()] ?? getValue<string>()}
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
              {clientMap[row.original.clientId] ?? row.original.clientId}
            </span>
            <span className="text-xs text-muted-foreground">
              {assignmentMap[row.original.assignmentId] ?? '—'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'taskCategory',
        header: 'Category',
        meta: { shrink: true, cellClassName: 'whitespace-nowrap' },
        cell: ({ getValue }) => (
          <span className="text-xs px-2 py-0.5 rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] bg-white/[0.04] text-[#A0A0A0] whitespace-nowrap">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'taskDescription',
        header: 'Description',
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
        accessorKey: 'timeSpent',
        header: 'Time',
        size: 85,
        meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatMinutes(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { shrink: true, cellClassName: 'whitespace-nowrap' },
        cell: ({ getValue }) => {
          const s = getValue<WorkEntryStatus>();
          return (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLES[s]}`}
            >
              {s.replace('_', ' ')}
            </span>
          );
        },
      },
    ],
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
              All VA work entries across clients
            </p>
          </div>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Select value={vaFilter} onValueChange={setVaFilter}>
              <SelectTrigger className="rounded-xl border-input h-8 text-sm w-44">
                <SelectValue placeholder="All VAs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All VAs</SelectItem>
                {crmVAs
                  .filter(v => v.candidateRef)
                  .map(v => (
                    <SelectItem key={v.candidateRef!} value={v.candidateRef!}>
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
                {filteredClients.map(c => (
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
              {allEntries.length} records
            </span>
          </div>

          <DataTable
            columns={columns}
            data={allEntries}
            isLoading={isLoading}
            isError={isError}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
