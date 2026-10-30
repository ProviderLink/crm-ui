import type { ColumnDef } from '@tanstack/react-table';
import { PenLineIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatMinutes } from '@/lib/time';
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry';

import { initialsOf, shortDate } from '../../admin/work-entries/format';
import { StatusPill } from '../../admin/work-entries/StatusPill';

export function buildWorkHistoryColumns({
  clientMap,
  assignmentMap,
  onEdit,
}: {
  clientMap: Map<string, string>;
  assignmentMap: Map<string, string>;
  onEdit: (entry: IWorkEntry) => void;
}): ColumnDef<IWorkEntry>[] {
  return [
    {
      accessorKey: 'clientId',
      header: 'Client',
      size: 250,
      cell: ({ row }) => {
        const client = clientMap.get(row.original.clientId) ?? '—';
        const service = assignmentMap.get(row.original.assignmentId) ?? '—';
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
              {initialsOf(client) || '?'}
            </div>
            <div>
              <p className="text-sm font-medium whitespace-nowrap">{client}</p>
              <p className="text-xs whitespace-nowrap text-muted-foreground">
                {service}
              </p>
            </div>
          </div>
        );
      },
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
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      meta: { shrink: true },
      cell: ({ row }) => (
        // Keep a click on the button from also opening the row.
        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit work entry"
                className="size-8 text-muted-foreground"
                onClick={() => onEdit(row.original)}
              >
                <PenLineIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Edit</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];
}
