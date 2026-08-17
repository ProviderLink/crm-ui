import { EodDetailSheet } from '@/components/eod/EodDetailSheet';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
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
import { exportReport, type ExportFormat } from '@/services/reports.service';
import type { IEodSubmission } from '@/types/eod-submission';
import type { ColumnDef } from '@tanstack/react-table';
import { DownloadIcon, EyeIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

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
              meta: {
                thClassName: 'hidden @3xl/main:table-cell',
                cellClassName: 'hidden @3xl/main:table-cell',
              },
              cell: ({ getValue }: any) => (
                <span className="text-sm">{String(getValue() ?? '—')}</span>
              ),
            },
            {
              accessorKey: 'shiftEnd',
              header: 'End',
              size: 45,
              meta: {
                thClassName: 'hidden @3xl/main:table-cell',
                cellClassName: 'hidden @3xl/main:table-cell',
              },
              cell: ({ getValue }: any) => (
                <span className="text-sm">{String(getValue() ?? '—')}</span>
              ),
            },
          ]),
      {
        accessorKey: 'hoursWorked',
        header: 'Hours',
        size: 30,
        meta: {
          headerClassName: 'text-center',
          cellClassName: 'text-center hidden @xl/main:table-cell',
          thClassName: 'hidden @xl/main:table-cell',
        },
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
        cell: ({ row }) => {
          const entries = row.original.workEntries;
          if (entries && entries.length > 0) {
            return (
              <span className="text-sm">
                {entries
                  .map(e => `${e.task}${e.quantity ? ` ×${e.quantity}` : ''}`)
                  .join(' · ')}
              </span>
            );
          }
          return (
            <span className="text-sm">{row.original.summaryOfWork || '—'}</span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 50,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            title="View Details"
            onClick={() => {
              setSelectedEodId(row.original._id);
              setSelectedEodFallback(row.original);
            }}
          >
            <EyeIcon className="size-3.5" />
          </Button>
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

            <Select
              value={exportFormat}
              onValueChange={v => setExportFormat(v as ExportFormat)}
            >
              <SelectTrigger className="rounded-xl border-input h-8 text-sm w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              disabled={exporting || !exportRangeValid}
              className="h-8 rounded-xl text-sm gap-2"
            >
              <DownloadIcon className="size-3.5" />
              {exporting ? 'Exporting…' : 'Export EODs'}
            </Button>

            <span className="text-xs text-muted-foreground ml-auto">
              {eods.length} records
            </span>
          </div>

          {exportError && (
            <p className="text-xs text-destructive mb-4">{exportError}</p>
          )}
          {!exportRangeValid && dateFrom !== '' && dateTo !== '' && (
            <p className="text-xs text-destructive mb-4">
              From date must be before or equal to To date
            </p>
          )}

          <DataTable
            columns={columns}
            data={eods}
            isLoading={isLoading}
            isError={isError}
            error={error}
          />
        </div>
      </div>

      <EodDetailSheet
        eodId={selectedEodId}
        fallback={selectedEodFallback}
        onOpenChange={open => {
          if (!open) {
            setSelectedEodId(null);
            setSelectedEodFallback(null);
          }
        }}
      />
    </div>
  );
}
