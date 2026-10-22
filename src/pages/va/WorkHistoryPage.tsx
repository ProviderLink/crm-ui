import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { DataTable } from '@/components/shared/DataTable';
import { DatePickerField } from '@/components/ui/date-picker-field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  useMyAssignmentsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries';
import type { IWorkEntry } from '@/types/work-entry';
import { addDaysToDateKey, todayString } from '@/lib/time';

import { buildWorkHistoryColumns } from './work-history/columns';
import { EditWorkEntryForm } from './work-history/EditWorkEntryForm';

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
  const [dateFrom, setDateFrom] = useState(() =>
    addDaysToDateKey(todayString(), -30)
  );
  const [dateTo, setDateTo] = useState(() => todayString());
  const [editEntry, setEditEntry] = useState<IWorkEntry | null>(null);

  const filtered = useMemo(
    () =>
      entries.filter(e => {
        const d = e.entryDate.slice(0, 10);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
      }),
    [entries, dateFrom, dateTo]
  );

  function clearFilters() {
    setDateFrom('');
    setDateTo('');
  }

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Work History
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                All your logged work entries
              </p>
            </div>
            <Link
              to="/va/work/new"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-text-inverse hover:bg-white transition-colors duration-150"
            >
              + Add Entry
            </Link>
          </div>

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

          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            isError={isError}
            error={error}
          />
        </div>
      </div>

      <Sheet
        open={editEntry !== null}
        onOpenChange={o => !o && setEditEntry(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Work Entry</SheetTitle>
            <SheetDescription>
              {editEntry ? editEntry.entryDate?.slice(0, 10) : ''}
            </SheetDescription>
          </SheetHeader>
          {editEntry && (
            <EditWorkEntryForm
              key={editEntry._id}
              entry={editEntry}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['work-entries'] });
                setEditEntry(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
