import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon, PenLineIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDateKeyLong } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';

import { Avatar } from '../accounts/badges';
import { AssignmentStatus } from './AssignmentStatus';

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
            <Avatar name={va} />
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
      header: 'Account manager',
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
      size: 110,
      cell: ({ getValue }) => (
        <AssignmentStatus status={getValue<IAssignment['status']>()} />
      ),
    },
  ];

  // Opening an assignment is the row click; admins also get a quiet menu.
  if (canManage) {
    columns.push({
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
                aria-label="Assignment actions"
              >
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(row.original)}>
                <PenLineIcon className="size-4" />
                Edit
              </DropdownMenuItem>
              {row.original.status !== 'ended' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => onDeactivate(row.original)}
                  >
                    <XIcon className="size-4" />
                    End assignment
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    });
  }

  return columns;
}
