import { useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { EodDetailSheet } from '@/components/eod/EodDetailSheet';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import {
  useEodContextQuery,
  useEodSubmissionsQuery,
  useMyAssignmentsQuery,
} from '@/hooks/queries';
import { addDaysToDateKey } from '@/lib/time';
import { deleteEodSubmission } from '@/services/eod-submissions.service';
import type { IAssignment } from '@/types/assignment';
import type { IEodSubmission } from '@/types/eod-submission';

import { buildEodHistoryColumns } from './eod-history/columns';
import { EodHistoryFilters } from './eod-history/EodHistoryFilters';

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
  const [selected, setSelected] = useState<IEodSubmission | null>(null);

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
    () =>
      buildEodHistoryColumns({
        clientMap,
        assignmentMap,
        onDelete: setDeleteTarget,
      }),
    [clientMap, assignmentMap]
  );

  // Defaults are derived from the company business day, not the device clock,
  // so a VA east of the company never loses a day of records.
  const { data: eodContext } = useEodContextQuery();
  const defaultTo = eodContext?.dateKey ?? '';
  const defaultFrom = eodContext
    ? addDaysToDateKey(eodContext.dateKey, -30)
    : '';
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!eodContext) return;
    setDateTo(prev => prev || eodContext.dateKey);
    setDateFrom(prev => prev || addDaysToDateKey(eodContext.dateKey, -30));
  }, [eodContext]);

  // Search matches the client, the service or the task names.
  const query = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      eods.filter(e => {
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        if (!query) return true;
        const client = clientMap.get(e.clientId) ?? '';
        const service = assignmentMap.get(e.assignmentId) ?? '';
        const tasks =
          e.workEntries && e.workEntries.length > 0
            ? e.workEntries.map(w => w.task).join(' ')
            : (e.summaryOfWork ?? '');
        return `${client} ${service} ${tasks}`.toLowerCase().includes(query);
      }),
    [eods, dateFrom, dateTo, query, clientMap, assignmentMap]
  );

  function clearFilters() {
    setSearch('');
    setDateFrom(defaultFrom);
    setDateTo(defaultTo);
  }

  const hasFilter =
    search !== '' || dateFrom !== defaultFrom || dateTo !== defaultTo;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                EOD History
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your end-of-day submissions
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/va/eod/new">
                <PlusIcon className="size-4" />
                Submit EOD
              </Link>
            </Button>
          </div>

          <EodHistoryFilters
            search={search}
            onSearchChange={setSearch}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            hasFilter={hasFilter}
            onClear={clearFilters}
            recordCount={filtered.length}
          />

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
            onRowClick={setSelected}
          />
        </div>
      </div>

      <EodDetailSheet
        eodId={selected?._id ?? null}
        fallback={selected}
        onOpenChange={open => !open && setSelected(null)}
      />

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
