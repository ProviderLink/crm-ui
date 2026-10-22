import type { ColumnDef } from '@tanstack/react-table';

import type { IEodSubmission } from '@/types/eod-submission';

import { VaCell } from './VaCell';

export function buildEodColumns(
  vaMap: Map<string, string>,
  assignmentMap: Map<string, string>
): ColumnDef<IEodSubmission>[] {
  return [
    {
      accessorKey: 'candidateId',
      header: 'VA',
      size: 200,
      cell: ({ row }) => (
        <VaCell name={vaMap.get(row.original.candidateId)} role={assignmentMap.get(row.original.assignmentId)} />
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      size: 105,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {getValue<string>()?.slice(0, 10)}
        </span>
      ),
    },
    {
      accessorKey: 'shiftStart',
      header: 'Start',
      size: 70,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'shiftEnd',
      header: 'End',
      size: 70,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'hoursWorked',
      header: 'Hours',
      size: 75,
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-foreground">
          {getValue<number>()}h
        </span>
      ),
    },
    {
      accessorKey: 'summaryOfWork',
      header: 'Summary',
      enableSorting: false,
      cell: ({ row }) => {
        const entries = row.original.workEntries;
        if (entries && entries.length > 0) {
          return (
            <span className="text-sm">
              {entries
                .map(e => `${e.task}${e.quantity ? ` ×${e.quantity}` : ''}`)
                .join(' · ')}
            </span>
          );
        }
        return (
          <span className="text-sm">{row.original.summaryOfWork || '—'}</span>
        );
      },
    },
    {
      accessorKey: 'pendingTasks',
      header: 'Pending Tasks',
      size: 200,
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'blockers',
      header: 'Blockers',
      size: 180,
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {getValue<string>() || '—'}
        </span>
      ),
    },
  ];
}
