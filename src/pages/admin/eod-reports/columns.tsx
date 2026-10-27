import type { ColumnDef } from '@tanstack/react-table';
import { EyeIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { IEodSubmission } from '@/types/eod-submission';

import { TaskSummary } from './TaskSummary';

export function buildEodColumns({
  vaMap,
  clientMap,
  assignmentMap,
  onView,
}: {
  vaMap: Record<string, string>;
  clientMap: Record<string, string>;
  assignmentMap: Record<string, string>;
  onView: (eod: IEodSubmission) => void;
}): ColumnDef<IEodSubmission>[] {
  return [
    {
      accessorKey: 'date',
      header: 'Date',
      size: 105,
      // Narrow screens: the date folds under the VA's name instead.
      meta: {
        thClassName: 'hidden @min-[1000px]/main:table-cell',
        cellClassName: 'hidden @min-[1000px]/main:table-cell',
      },
      cell: ({ getValue }) => (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {getValue<string>()?.slice(0, 10)}
        </span>
      ),
    },
    {
      accessorKey: 'candidateId',
      header: 'VA',
      size: 140,
      cell: ({ row, getValue }) => (
        <div>
          <p className="text-sm font-medium">
            {row.original.candidateName ||
              vaMap[getValue<string>()] ||
              getValue<string>()}
          </p>
          <p className="mt-0.5 text-xs whitespace-nowrap text-muted-foreground @min-[1000px]/main:hidden">
            {row.original.date?.slice(0, 10)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'clientId',
      header: 'Client',
      size: 190,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">
            {row.original.companyName ||
              clientMap[row.original.clientId] ||
              row.original.clientId}
          </span>
          <span className="text-xs text-muted-foreground">
            {assignmentMap[row.original.assignmentId] ?? '—'}
          </span>
        </div>
      ),
    },
    {
      // Start, end and hours in one column: "09:00 – 17:00  8h". Narrow
      // screens keep just the hours.
      accessorKey: 'hoursWorked',
      header: 'Shift',
      cell: ({ row }) => {
        const { shiftStart, shiftEnd, hoursWorked } = row.original;
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="hidden text-sm tabular-nums text-muted-foreground @3xl/main:inline">
              {shiftStart ?? '—'} – {shiftEnd ?? '—'}
            </span>
            <span className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
              {hoursWorked}h
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'summaryOfWork',
      header: 'Summary',
      enableSorting: false,
      meta: { fill: true, cellClassName: 'max-w-0' },
      cell: ({ row }) => <TaskSummary eod={row.original} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 90,
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          aria-label="View EOD details"
          className="h-7 gap-1.5 rounded-lg text-xs"
          onClick={() => onView(row.original)}
        >
          <EyeIcon className="size-3.5" />
          View
        </Button>
      ),
    },
  ];
}
