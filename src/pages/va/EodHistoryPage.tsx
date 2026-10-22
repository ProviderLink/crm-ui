import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import {
  useEodContextQuery,
  useEodSubmissionsQuery,
  useMyAssignmentsQuery,
} from '@/hooks/queries';
import { addDaysToDateKey } from '@/lib/time';
import { deleteEodSubmission } from '@/services/eod-submissions.service';
import type { IAssignment } from '@/types/assignment';
import type { IEodSubmission } from '@/types/eod-submission';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Trash2Icon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function buildColumns(
  clientMap: Map<string, string>,
  assignmentMap: Map<string, string>,
  onDelete: (eod: IEodSubmission) => void
): ColumnDef<IEodSubmission>[] {
  return [
    {
      accessorKey: 'clientId',
      header: 'Client',
      size: 200,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {clientMap.get(row.original.clientId) ?? '—'}
          </span>
          <span className="text-xs text-muted-foreground">
            {assignmentMap.get(row.original.assignmentId) ?? '—'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      size: 105,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {getValue<string>()?.slice(0, 10)}
        </span>
      ),
    },
    {
      accessorKey: 'shiftStart',
      header: 'Start',
      size: 70,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'shiftEnd',
      header: 'End',
      size: 70,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'hoursWorked',
      header: 'Hours',
      size: 75,
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
    {
      id: 'actions',
      header: '',
      size: 50,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon" aria-label="Delete EOD submission"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(row.original)}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      ),
    },
  ];
}

export default function EodHistoryPage() {
  const queryClient = useQueryClient();
  const {
    data: eods = [],
    isLoading,
    isError,
    error,
  } = useEodSubmissionsQuery();
  const { data: myAssignments = [] } = useMyAssignmentsQuery();

  const [deleteTarget, setDeleteTarget] = useState<IEodSubmission | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const clientMap = useMemo(() => {
    const m = new Map<string, string>();
    myAssignments.forEach((a: IAssignment) => {
      if (a.companyName) m.set(a.clientId, a.companyName);
    });
    return m;
  }, [myAssignments]);

  const assignmentMap = useMemo(() => {
    const m = new Map<string, string>();
    myAssignments.forEach((a: IAssignment) =>
      m.set(a._id, a.serviceType ?? 'VA Service')
    );
    return m;
  }, [myAssignments]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteEodSubmission(deleteTarget._id);
      queryClient.invalidateQueries({ queryKey: ['eod-submissions'] });
    } catch {
      setDeleteError('Failed to delete EOD submission. Please try again.');
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns = useMemo(
    () => buildColumns(clientMap, assignmentMap, setDeleteTarget),
    [clientMap, assignmentMap]
  );
  // Defaults are derived from the company business day, not the device clock,
  // so a VA east of the company never loses a day of records.
  const { data: eodContext } = useEodContextQuery();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!eodContext) return;
    setDateTo(prev => prev || eodContext.dateKey);
    setDateFrom(prev => prev || addDaysToDateKey(eodContext.dateKey, -30));
  }, [eodContext]);

  const filtered = useMemo(
    () =>
      eods.filter(e => {
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        return true;
      }),
    [eods, dateFrom, dateTo]
  );

  function clearFilters() {
    setDateFrom('');
    setDateTo('');
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                EOD History
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your end-of-day submissions
              </p>
            </div>
            <Link
              to="/va/eod/new"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-text-inverse hover:bg-white transition-colors duration-150"
            >
              + Submit EOD
            </Link>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
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
            {(dateFrom || dateTo) && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} records
            </span>
          </div>

          {deleteError && (
            <p className="mb-2 text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          )}

          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            isError={isError}
            error={error}
          />
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete EOD Submission"
        description={
          deleteTarget
            ? `Delete the EOD submission for ${deleteTarget.date?.slice(0, 10)}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
