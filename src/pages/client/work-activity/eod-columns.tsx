import type { ColumnDef } from '@tanstack/react-table';

import type { IEodSubmission } from '@/types/eod-submission';

import { TaskSummary } from '../../admin/eod-reports/TaskSummary';
import { shortDate } from '../../admin/work-entries/format';
import { VaCell } from './VaCell';

export function buildEodColumns(
  vaMap: Map<string, string>,
  assignmentMap: Map<string, string>
): ColumnDef<IEodSubmission>[] {
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
      meta: {
        fill: true,
        thClassName: 'min-w-[16rem]',
        cellClassName: 'min-w-[16rem]',
      },
      cell: ({ row }) => <TaskSummary eod={row.original} />,
    },
  ];
}
