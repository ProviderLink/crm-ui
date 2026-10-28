import type { ColumnDef } from '@tanstack/react-table';

import { formatMinutes } from '@/lib/time';
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry';
import { WORK_ENTRY_STATUS_STYLES } from '@/lib/status-styles';

import { VaCell } from './VaCell';

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
            className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${WORK_ENTRY_STATUS_STYLES[s]}`}
          >
            {s.replace('_', ' ')}
          </span>
        );
      },
    },
  ];
}
