import type { ColumnDef } from '@tanstack/react-table';
import { PenLineIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDateKeyLong } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

const STATUS_STYLES: Record<IAssignment['status'], string> = {
  active: 'bg-white/[0.04] text-status-success border-status-success/20',
  on_hold: 'bg-white/[0.04] text-status-warning border-status-warning/20',
  ended: 'bg-white/[0.04] text-text-tertiary border-white/[0.08]',
};

const STATUS_LABELS: Record<IAssignment['status'], string> = {
  active: 'Active',
  on_hold: 'On hold',
  ended: 'Ended',
};

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export function buildColumns({
  clientMap,
  vaMap,
  amMap,
  onEdit,
  onDeactivate,
  canManage,
}: {
  clientMap: Record<string, string>;
  vaMap: Record<string, string>;
  amMap: Record<string, string>;
  onEdit: (a: IAssignment) => void;
  onDeactivate: (a: IAssignment) => void;
  canManage: boolean;
}): ColumnDef<IAssignment>[] {
  const columns: ColumnDef<IAssignment>[] = [
    {
      // Who works for whom: the VA, with their client underneath.
      id: 'va',
      header: 'Assignment',
      meta: { fill: true, cellClassName: 'max-w-0' },
      accessorFn: a => a.candidateName || vaMap[a.candidateId] || '',
      cell: ({ row }) => {
        const a = row.original;
        const va = a.candidateName || vaMap[a.candidateId] || a.candidateId;
        const client = a.companyName || clientMap[a.clientId] || a.clientId;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] font-mono text-xs text-text-secondary">
              {initialsOf(va) || '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={va}>
                {va}
              </p>
              <p
                className="truncate text-xs text-muted-foreground"
                title={a.serviceType ? `${client} · ${a.serviceType}` : client}
              >
                {client}
                {/* Narrow screens: the service type folds in here. */}
                {a.serviceType && (
                  <span className="@min-[1000px]/main:hidden">
                    {' · '}
                    {a.serviceType}
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'serviceType',
      header: 'Service',
      meta: {
        thClassName: 'hidden @min-[1000px]/main:table-cell',
        cellClassName: 'hidden @min-[1000px]/main:table-cell',
      },
      cell: ({ getValue }) => (
        <span className="text-sm whitespace-nowrap">
          {getValue<string | undefined>() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'accountManagerId',
      header: 'Account Manager',
      meta: { thClassName: 'whitespace-nowrap' },
      cell: ({ row, getValue }) => (
        <span className="text-sm whitespace-nowrap">
          {row.original.accountManagerName ||
            amMap[getValue<string>() ?? ''] ||
            '—'}
        </span>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Started',
      cell: ({ row }) => {
        const { startDate, endDate } = row.original;
        return (
          <div className="leading-tight whitespace-nowrap">
            <p className="text-sm">
              {startDate ? formatDateKeyLong(startDate) : '—'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {endDate ? `Ended ${formatDateKeyLong(endDate)}` : 'Ongoing'}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const v = getValue<IAssignment['status']>();
        return (
          <span
            className={`rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${STATUS_STYLES[v] ?? STATUS_STYLES.ended}`}
          >
            {STATUS_LABELS[v] ?? v}
          </span>
        );
      },
    },
  ];

  // Opening an assignment is the row click; the only buttons left are for
  // admins, who can edit or end it.
  if (canManage) {
    columns.push({
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      size: 100,
      cell: ({ row }) => (
        <TooltipProvider delayDuration={300}>
          {/* Keep a click on a button from also opening the row. */}
          <div
            className="flex items-center gap-1.5 whitespace-nowrap"
            onClick={e => e.stopPropagation()}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit assignment"
                  className="size-7 border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                  onClick={() => onEdit(row.original)}
                >
                  <PenLineIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Edit</TooltipContent>
            </Tooltip>

            {row.original.status !== 'ended' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="End assignment"
                    className="size-7 border border-status-error/30 bg-white/[0.02] text-status-error/80 hover:border-status-error/50 hover:bg-status-error/10 hover:text-status-error"
                    onClick={() => onDeactivate(row.original)}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">End Assignment</TooltipContent>
              </Tooltip>
            ) : (
              <div className="size-7" />
            )}
          </div>
        </TooltipProvider>
      ),
    });
  }

  return columns;
}
