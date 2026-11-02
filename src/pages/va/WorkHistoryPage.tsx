import { useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import {
  QK,
  useMyAllAssignmentsQuery,
  useWorkEntriesQuery,
  useCompanyDay,
} from '@/hooks/queries';
import { useDateRange } from '@/hooks/use-date-range';
import type { IWorkEntry } from '@/types/work-entry';

import { WorkEntryFilters } from '@/features/work-entries/WorkEntryFilters';
import { buildWorkHistoryColumns } from './work-history/columns';
import { EditWorkEntryDrawer } from './work-history/EditWorkEntryDrawer';

export default function WorkHistoryPage() {
  const queryClient = useQueryClient();
  // The default window is the last 30 days; "Clear" returns to it. The server
  // is asked for just that window, so a long history is never cut off.
  const { today } = useCompanyDay();
  const range = useDateRange(today);
  const { dateFrom, setDateFrom, dateTo, setDateTo } = range;
  const {
    data: entries = [],
    isLoading,
    isError,
    error,
  } = useWorkEntriesQuery({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  // All of the VA's assignments, not only active ones: entries of an ended or
  // on-hold assignment keep their client and service names.
  const { data: myAssignments = [] } = useMyAllAssignmentsQuery();

  const clientMap = useMemo(() => {
    const m = new Map<string, string>();
    myAssignments.forEach(a => {
      if (a.companyName) m.set(a.clientId, a.companyName);
    });
    return m;
  }, [myAssignments]);

  const assignmentMap = useMemo(() => {
    const m = new Map<string, string>();
    myAssignments.forEach(a => m.set(a._id, a.serviceType ?? 'VA Service'));
    return m;
  }, [myAssignments]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [editEntry, setEditEntry] = useState<IWorkEntry | null>(null);

  // Search matches the client, the service, the category or the task text.
  const query = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      entries.filter(e => {
        const d = e.entryDate.slice(0, 10);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        if (status !== 'all' && e.status !== status) return false;
        if (category !== 'all' && e.taskCategory !== category) return false;
        if (!query) return true;
        const client = clientMap.get(e.clientId) ?? '';
        const service = assignmentMap.get(e.assignmentId) ?? '';
        return `${client} ${service} ${e.taskCategory} ${e.taskDescription}`
          .toLowerCase()
          .includes(query);
      }),
    [
      entries,
      dateFrom,
      dateTo,
      status,
      category,
      query,
      clientMap,
      assignmentMap,
    ]
  );

  function clearFilters() {
    setSearch('');
    setStatus('all');
    setCategory('all');
    range.reset();
  }

  const hasFilter =
    search !== '' || status !== 'all' || category !== 'all' || range.isChanged;

  const columns = useMemo(
    () =>
      buildWorkHistoryColumns({
        clientMap,
        assignmentMap,
        onEdit: setEditEntry,
      }),
    [clientMap, assignmentMap]
  );

  return (
    <Page
      overlays={
        <>
          <EditWorkEntryDrawer
            entry={editEntry}
            clientName={
              editEntry
                ? (clientMap.get(editEntry.clientId) ?? 'Work entry')
                : ''
            }
            service={
              editEntry ? assignmentMap.get(editEntry.assignmentId) : undefined
            }
            onClose={() => setEditEntry(null)}
            onSaved={() => {
              void queryClient.invalidateQueries({
                queryKey: QK.workEntriesAll,
              });
              setEditEntry(null);
            }}
          />
        </>
      }
    >
      <PageSection>
        <PageHeader
          title="Work History"
          description="All your logged work entries"
          actions={
            <Button asChild size="sm">
              <Link to="/va/work/new">
                <PlusIcon className="size-4" />
                Add Entry
              </Link>
            </Button>
          }
        />

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
          recordCount={filtered.length}
          searchPlaceholder="Search client or task…"
        />

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRowClick={setEditEntry}
        />
      </PageSection>
    </Page>
  );
}
