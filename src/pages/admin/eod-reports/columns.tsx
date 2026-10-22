import type { ColumnDef } from '@tanstack/react-table';
import { EyeIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { IEodSubmission } from '@/types/eod-submission';

function shiftColumn(
  key: 'shiftStart' | 'shiftEnd',
  header: string
): ColumnDef<IEodSubmission> {
  return {
    accessorKey: key,
    header,
    size: 45,
    meta: {
      thClassName: 'hidden @3xl/main:table-cell',
      cellClassName: 'hidden @3xl/main:table-cell',
    },
    cell: ({ getValue }) => (
      <span className="text-sm">{String(getValue() ?? '—')}</span>
    ),
  };
}

export function buildEodColumns({
  vaMap,
  clientMap,
  assignmentMap,
  isAccountManager,
  onView,
}: {
  vaMap: Record<string, string>;
  clientMap: Record<string, string>;
  assignmentMap: Record<string, string>;
  isAccountManager: boolean;
  onView: (eod: IEodSubmission) => void;
}): ColumnDef<IEodSubmission>[] {
  return [
      {
        accessorKey: 'date',
        header: 'Date',
        size: 115,
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {getValue<string>()?.slice(0, 10)}
          </span>
        ),
      },
      {
        accessorKey: 'candidateId',
        header: 'VA',
        size: 140,
        cell: ({ row, getValue }) => (
          <span className="text-sm">
            {row.original.candidateName ||
              vaMap[getValue<string>()] ||
              getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'clientId',
        header: 'Client',
        size: 220,
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
      ...(isAccountManager
        ? []
        : [shiftColumn('shiftStart', 'Start'), shiftColumn('shiftEnd', 'End')]),
      {
        accessorKey: 'hoursWorked',
        header: 'Hours',
        size: 30,
        meta: {
          headerClassName: 'text-center',
          cellClassName: 'text-center hidden @xl/main:table-cell',
          thClassName: 'hidden @xl/main:table-cell',
        },
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
        meta: {
          fill: true,
          cellClassName: 'bg-white/[0.04] border-l border-white/[0.06]',
        },
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
        id: 'actions',
        header: '',
        size: 50,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            title="View Details"
            onClick={() => onView(row.original)}
          >
            <EyeIcon className="size-3.5" />
          </Button>
        ),
      },
  ];
}
