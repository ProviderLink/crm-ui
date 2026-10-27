import type { ColumnDef } from '@tanstack/react-table';

import { WORK_ENTRY_STATUS_STYLES } from '@/lib/status-styles';
import { formatMinutes } from '@/lib/time';
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry';

export function buildWorkEntryColumns({
  vaMap,
  clientMap,
  assignmentMap,
}: {
  vaMap: Record<string, string>;
  clientMap: Record<string, string>;
  assignmentMap: Record<string, string>;
}): ColumnDef<IWorkEntry>[] {
  return [
    {
      accessorKey: 'entryDate',
      header: 'Date',
      size: 105,
      // Narrow screens: the date folds under the VA's name instead.
      meta: {
        thClassName: 'hidden @min-[1000px]/main:table-cell',
        cellClassName: 'hidden @min-[1000px]/main:table-cell',
      },
      cell: ({ row }) => (
        <div className="leading-tight">
          <p className="text-sm whitespace-nowrap text-muted-foreground">
            {row.original.entryDate?.slice(0, 10)}
          </p>
          {row.original.entryTime && (
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {row.original.entryTime}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'candidateId',
      header: 'VA',
      size: 130,
      cell: ({ row, getValue }) => (
        <div>
          <p className="text-sm font-medium @min-[1000px]/main:whitespace-nowrap">
            {row.original.candidateName ||
              vaMap[getValue<string>()] ||
              getValue<string>()}
          </p>
          <p className="mt-0.5 text-xs whitespace-nowrap text-muted-foreground @min-[1000px]/main:hidden">
            {row.original.entryDate?.slice(0, 10)}
            {row.original.entryTime ? ` · ${row.original.entryTime}` : ''}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'clientId',
      header: 'Client',
      size: 160,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm @min-[1000px]/main:whitespace-nowrap">
            {row.original.companyName ||
              clientMap[row.original.clientId] ||
              row.original.clientId}
          </span>
          <span className="text-xs text-muted-foreground @min-[1000px]/main:whitespace-nowrap">
            {assignmentMap[row.original.assignmentId] ?? '—'}
          </span>
        </div>
      ),
    },
    {
      // The task, with its category underneath instead of a column of its own.
      accessorKey: 'taskDescription',
      header: 'Task',
      enableSorting: false,
      meta: { fill: true, cellClassName: 'max-w-0' },
      cell: ({ row }) => (
        <div title={row.original.taskDescription}>
          <p className="line-clamp-2 text-sm leading-snug">
            {row.original.taskDescription}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1 shrink-0 rounded-full bg-muted-foreground/50" />
            <span className="truncate">{row.original.taskCategory}</span>
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'timeSpent',
      header: 'Time',
      size: 80,
      cell: ({ getValue }) => (
        <span className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-xs font-medium whitespace-nowrap text-foreground">
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
            className={`rounded-full border px-2 py-0.5 text-xs whitespace-nowrap capitalize ${WORK_ENTRY_STATUS_STYLES[s]}`}
          >
            {s.replace('_', ' ')}
          </span>
        );
      },
    },
  ];
}
