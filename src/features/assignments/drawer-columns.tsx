import type { ColumnDef } from '@tanstack/react-table';

import { WorkStatusPill } from '@/components/shared/badges';
import { formatMinutes } from '@/lib/time';
import type { IEodSubmission } from '@/types/eod-submission';
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry';

import { formatDate } from '@/lib/format';

// ─── Table columns ────────────────────────────────────────────────────────────

export function buildWorkColumns(): ColumnDef<IWorkEntry>[] {
  return [
    {
      accessorKey: 'entryDate',
      header: 'Date',
      size: 120,
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="text-sm">{formatDate(row.original.entryDate)}</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {row.original.entryTime}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'taskDescription',
      header: () => <span className="normal-case">Task</span>,
      enableSorting: false,
      meta: {
        fill: true,
        thClassName: 'min-w-[12rem]',
        cellClassName: 'min-w-[12rem]',
      },
      cell: ({ row }) => (
        <div>
          <p className="text-sm leading-snug">{row.original.taskDescription}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {row.original.taskCategory}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'timeSpent',
      header: 'Time',
      size: 80,
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums whitespace-nowrap">
          {formatMinutes(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ getValue }) => (
        <WorkStatusPill status={getValue<WorkEntryStatus>()} />
      ),
    },
  ];
}

export function buildEodColumns(): ColumnDef<IEodSubmission>[] {
  return [
    {
      accessorKey: 'date',
      header: 'Date',
      size: 120,
      cell: ({ getValue }) => (
        <span className="text-sm whitespace-nowrap">
          {formatDate(getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: 'hoursWorked',
      header: 'Hours',
      size: 110,
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="text-sm tabular-nums">{row.original.hoursWorked}h</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {row.original.shiftStart} – {row.original.shiftEnd}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'summaryOfWork',
      header: () => <span className="normal-case">Summary</span>,
      enableSorting: false,
      meta: {
        fill: true,
        thClassName: 'min-w-[12rem]',
        cellClassName: 'min-w-[12rem]',
      },
      cell: ({ row }) => {
        const entries = row.original.workEntries;
        const text =
          entries && entries.length > 0
            ? entries
                .map(e => `${e.task}${e.quantity ? ` ×${e.quantity}` : ''}`)
                .join(' · ')
            : row.original.summaryOfWork || '—';
        const pending = row.original.pendingTasks?.trim();
        return (
          <div>
            <p className="text-sm leading-snug">{text}</p>
            {pending && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pending: {pending}
              </p>
            )}
          </div>
        );
      },
    },
  ];
}
