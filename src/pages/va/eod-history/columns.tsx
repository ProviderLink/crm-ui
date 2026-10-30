import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { IEodSubmission } from '@/types/eod-submission';

import { TaskSummary } from '../../admin/eod-reports/TaskSummary';
import { initialsOf, shortDate } from '../../admin/work-entries/format';

export function buildEodHistoryColumns({
  clientMap,
  assignmentMap,
  onDelete,
}: {
  clientMap: Map<string, string>;
  assignmentMap: Map<string, string>;
  onDelete: (eod: IEodSubmission) => void;
}): ColumnDef<IEodSubmission>[] {
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
      accessorKey: 'date',
      header: 'Date',
      size: 125,
      cell: ({ getValue }) => (
        <span className="text-sm whitespace-nowrap">
          {shortDate(getValue<string>())}
        </span>
      ),
    },
    {
      // Hours on top, the shift window underneath.
      accessorKey: 'hoursWorked',
      header: 'Hours',
      size: 130,
      cell: ({ row }) => {
        const { shiftStart, shiftEnd, hoursWorked } = row.original;
        return (
          <div className="inline-block rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 whitespace-nowrap">
            <p className="text-sm tabular-nums">{hoursWorked}h</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {shiftStart ?? '—'} – {shiftEnd ?? '—'}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'summaryOfWork',
      header: () => <span className="normal-case">Summary</span>,
      enableSorting: false,
      // Text wraps rather than truncating; never squeezed below a readable width.
      meta: {
        fill: true,
        thClassName: 'min-w-[16rem]',
        cellClassName: 'min-w-[16rem]',
      },
      cell: ({ row }) => <TaskSummary eod={row.original} />,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      meta: { shrink: true },
      cell: ({ row }) => (
        // Keep a click in the menu from also opening the row.
        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground"
                aria-label="EOD actions"
              >
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onDelete(row.original)}
              >
                <Trash2Icon className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
