import { PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import { EodDetailSheet } from '@/features/eod/EodDetailSheet';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import {
  QK,
  useEodContextQuery,
  useEodSubmissionsQuery,
  useMyAssignmentsQuery,
} from '@/hooks/queries';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { addDaysToDateKey } from '@/lib/time';
import { deleteEodSubmission } from '@/services/eod-submissions.service';
import type { IAssignment } from '@/types/assignment';
import type { IEodSubmission } from '@/types/eod-submission';

import { buildEodHistoryColumns } from './eod-history/columns';
import { EodHistoryFilters } from './eod-history/EodHistoryFilters';

export default function EodHistoryPage() {
  const {
    data: eods = [],
    isLoading,
    isError,
    error,
  } = useEodSubmissionsQuery();
  const { data: myAssignments = [] } = useMyAssignmentsQuery();

  const [deleteTarget, setDeleteTarget] = useState<IEodSubmission | null>(null);
  const remove = useApiMutation({
    mutationFn: deleteEodSubmission,
    invalidate: [QK.eodSubmissionsAll],
    errorMessage: 'Failed to delete EOD submission. Please try again.',
  });
  const deleteError = remove.error;
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
    await remove.run(deleteTarget._id);
    setDeleteTarget(null);
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
  // `null` follows the default window; a value (even '') is the user's choice.
  const [fromChoice, setDateFrom] = useState<string | null>(null);
  const [toChoice, setDateTo] = useState<string | null>(null);
  const dateFrom = fromChoice ?? defaultFrom;
  const dateTo = toChoice ?? defaultTo;
  const [search, setSearch] = useState('');

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
    setDateFrom(null);
    setDateTo(null);
  }

  const hasFilter =
    search !== '' || dateFrom !== defaultFrom || dateTo !== defaultTo;

  return (
    <Page
      overlays={
        <>
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
        </>
      }
    >
      <PageSection>
        <PageHeader
          title="EOD History"
          description="Your end-of-day submissions"
          actions={
            <Button asChild size="sm">
              <Link to="/va/eod/new">
                <PlusIcon className="size-4" />
                Submit EOD
              </Link>
            </Button>
          }
        />

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
      </PageSection>
    </Page>
  );
}
