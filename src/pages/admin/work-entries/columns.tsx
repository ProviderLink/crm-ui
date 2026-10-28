import type { ColumnDef } from '@tanstack/react-table';

import { formatMinutes } from '@/lib/time';
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry';

import { initialsOf, shortDate } from './format';
import { StatusPill } from './StatusPill';

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
      id: 'va',
      header: 'VA',
      size: 250,
      accessorFn: e => e.candidateName || vaMap[e.candidateId] || e.candidateId,
      cell: ({ row }) => {
        const e = row.original;
        const name = e.candidateName || vaMap[e.candidateId] || e.candidateId;
        const client = e.companyName || clientMap[e.clientId] || e.clientId;
        const service = assignmentMap[e.assignmentId];
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
              {initialsOf(name) || '?'}
            </div>
            <div>
              <p className="text-sm font-medium whitespace-nowrap">{name}</p>
              <p className="text-xs whitespace-nowrap text-muted-foreground">
                {service ? `${client} · ${service}` : client}
              </p>
            </div>
          </div>
        );
      },
    },
    {
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
      // The task, with its category underneath; wraps as far as it needs.
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
          <p className="text-sm leading-snug">
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
