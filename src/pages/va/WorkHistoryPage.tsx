import { useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { useMyAssignmentsQuery, useWorkEntriesQuery } from '@/hooks/queries';
import { addDaysToDateKey, todayString } from '@/lib/time';
import type { IWorkEntry } from '@/types/work-entry';

import { WorkEntryFilters } from '../admin/work-entries/WorkEntryFilters';
import { buildWorkHistoryColumns } from './work-history/columns';
import { EditWorkEntryDrawer } from './work-history/EditWorkEntryDrawer';

export default function WorkHistoryPage() {
  const queryClient = useQueryClient();
  const {
    data: entries = [],
    isLoading,
    isError,
    error,
  } = useWorkEntriesQuery();
  const { data: myAssignments = [] } = useMyAssignmentsQuery();

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
    setDateFrom(defaults.from);
    setDateTo(defaults.to);
  }

  const hasFilter =
    search !== '' ||
    status !== 'all' ||
    category !== 'all' ||
    dateFrom !== defaults.from ||
    dateTo !== defaults.to;

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
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Work History
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                All your logged work entries
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/va/work/new">
                <PlusIcon className="size-4" />
                Add Entry
              </Link>
            </Button>
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
        </div>
      </div>

      <EditWorkEntryDrawer
        entry={editEntry}
        clientName={
          editEntry ? (clientMap.get(editEntry.clientId) ?? 'Work entry') : ''
        }
        service={editEntry ? assignmentMap.get(editEntry.assignmentId) : undefined}
        onClose={() => setEditEntry(null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['work-entries'] });
          setEditEntry(null);
        }}
      />
    </div>
  );
}
