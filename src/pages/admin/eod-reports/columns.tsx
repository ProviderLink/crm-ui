import type { ColumnDef } from '@tanstack/react-table';

import { InitialsTile } from '@/components/shared/badges';
import { formatDate } from '@/lib/format';
import type { IEodSubmission } from '@/types/eod-submission';

import { TaskSummary } from './TaskSummary';

export function buildEodColumns({
  vaMap,
  clientMap,
  assignmentMap,
}: {
  vaMap: Record<string, string>;
  clientMap: Record<string, string>;
  assignmentMap: Record<string, string>;
}): ColumnDef<IEodSubmission>[] {
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
        const sub = service ? `${client} · ${service}` : client;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <InitialsTile name={name} />
            <div className="min-w-0">
              <p className="text-sm font-medium whitespace-nowrap">{name}</p>
              <p className="text-xs whitespace-nowrap text-muted-foreground">
                {sub}
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
          {formatDate(getValue<string>())}
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
  ];
}
