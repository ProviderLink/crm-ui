import type { ColumnDef } from '@tanstack/react-table';

import { formatMinutes } from '@/lib/time';
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry';

import { VaCell } from './VaCell';

const STATUS_STYLES: Record<WorkEntryStatus, string> = {
  completed: 'bg-white/[0.04] text-text-secondary border-[rgba(255,255,255,0.08)]',
  in_progress: 'bg-white/[0.04] text-text-secondary border-[rgba(255,255,255,0.08)]',
  pending: 'bg-white/[0.04] text-text-tertiary border-[rgba(255,255,255,0.08)]',
};

export function buildWorkColumns(
  vaMap: Map<string, string>,
  assignmentMap: Map<string, string>
): ColumnDef<IWorkEntry>[] {
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
      accessorKey: 'entryDate',
      header: 'Date',
      size: 105,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {getValue<string>()?.slice(0, 10)}
        </span>
      ),
    },
    {
      accessorKey: 'entryTime',
      header: 'Time',
      size: 75,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'taskCategory',
      header: 'Category',
      size: 160,
      cell: ({ getValue }) => (
        <span className="text-xs px-2 py-0.5 rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] bg-white/[0.04] text-text-secondary whitespace-nowrap">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'taskDescription',
      header: 'Description',
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'timeSpent',
      header: 'Time Spent',
      size: 95,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {formatMinutes(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 125,
      cell: ({ getValue }) => {
        const s = getValue<WorkEntryStatus>();
        return (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLES[s]}`}
          >
            {s.replace('_', ' ')}
          </span>
        );
      },
    },
  ];
}
