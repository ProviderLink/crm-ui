import { useMemo, useState } from 'react';

import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import { DataTable } from '@/components/shared/DataTable';
import { useAllAssignmentsQuery, useWorkEntriesQuery } from '@/hooks/queries';
import { useDateRange } from '@/hooks/use-date-range';
import {
  useClientNames,
  useServiceNames,
  useVaNames,
} from '@/hooks/use-name-maps';

import type { IWorkEntry } from '@/types/work-entry';

import { buildWorkEntryColumns } from './work-entries/columns';
import { WorkEntryDrawer } from './work-entries/WorkEntryDrawer';
import { WorkEntryFilters } from './work-entries/WorkEntryFilters';

export default function WorkEntriesPage() {
  // The default window is the last 30 days; "Clear" returns to it.
  const range = useDateRange();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = range;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<IWorkEntry | null>(null);

  const {
    data: entriesInRange = [],
    isLoading,
    isError,
    error,
  } = useWorkEntriesQuery({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: assignments = [] } = useAllAssignmentsQuery();
  const vaMap = useVaNames();
  const clientMap = useClientNames();
  const assignmentMap = useServiceNames(assignments);

  const columns = useMemo(
    () => buildWorkEntryColumns({ vaMap, clientMap, assignmentMap }),
    [vaMap, clientMap, assignmentMap]
  );

  // Search matches the VA, the client, the service or the task text.
  const query = search.trim().toLowerCase();
  const entries = useMemo(
    () =>
      entriesInRange.filter(e => {
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
    [entriesInRange, status, category, query, vaMap, clientMap, assignmentMap]
  );

  function clearFilters() {
    setSearch('');
    setStatus('all');
    setCategory('all');
    range.reset();
  }

  const hasFilter =
    search !== '' || status !== 'all' || category !== 'all' || range.isChanged;

  return (
    <Page
      overlays={
        <>
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
            service={
              selected ? assignmentMap[selected.assignmentId] : undefined
            }
            onClose={() => setSelected(null)}
          />
        </>
      }
    >
      <PageSection>
        <PageHeader
          title="Work Entries"
          description="All VA work entries across clients"
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
      </PageSection>
    </Page>
  );
}
