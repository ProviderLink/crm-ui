import type { ColumnDef } from '@tanstack/react-table';

import { formatMinutes } from '@/lib/time';
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry';

import { shortDate } from '../../admin/work-entries/format';
import { StatusPill } from '../../admin/work-entries/StatusPill';
import { VaCell } from './VaCell';

export function buildWorkColumns(
  vaMap: Map<string, string>,
  assignmentMap: Map<string, string>
): ColumnDef<IWorkEntry>[] {
  return [
    {
      accessorKey: 'candidateId',
      header: 'VA',
      size: 250,
      cell: ({ row }) => (
        <VaCell
          name={vaMap.get(row.original.candidateId)}
          role={assignmentMap.get(row.original.assignmentId)}
        />
      ),
    },
    {
      // The date, with the start time underneath.
      accessorKey: 'entryDate',
      header: 'Date',
      size: 125,
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="text-sm">{shortDate(row.original.entryDate)}</p>
          {row.original.entryTime && (
            <p className="text-xs tabular-nums text-muted-foreground">
              {row.original.entryTime}
            </p>
          )}
        </div>
      ),
    },
    {
      // The task, with its category underneath. Long text stops at two lines;
      // the full text is in the tooltip and in the detail drawer.
      accessorKey: 'taskDescription',
      header: () => <span className="normal-case">Task</span>,
      enableSorting: false,
      meta: {
        fill: true,
        thClassName: 'min-w-[16rem]',
        cellClassName: 'min-w-[16rem]',
      },
      cell: ({ row }) => (
        <div>
          <p
            className="line-clamp-2 text-sm leading-snug"
            title={row.original.taskDescription}
          >
            {row.original.taskDescription}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {row.original.taskCategory}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'timeSpent',
      header: 'Time',
      size: 90,
      cell: ({ getValue }) => (
        <span className="inline-block rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-sm tabular-nums whitespace-nowrap">
          {formatMinutes(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ getValue }) => <StatusPill status={getValue<WorkEntryStatus>()} />,
    },
  ];
}
