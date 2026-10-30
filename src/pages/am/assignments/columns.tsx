import type { ColumnDef } from '@tanstack/react-table';

import { formatDateKeyShort } from '@/lib/time';

import { HealthBadge } from '../../admin/accounts/badges';
import { AssignmentStatus } from '../../admin/assignments/AssignmentStatus';
import { initialsOf } from '../../admin/work-entries/format';
import { TodayPill } from './TodayPill';
import type { AssignmentRow } from './use-am-assignments';

const dash = <span className="text-xs text-muted-foreground/50">—</span>;

export function buildAmAssignmentColumns(): ColumnDef<AssignmentRow>[] {
  return [
    {
      // Who works for whom, with a flag when a blocker was reported.
      id: 'va',
      header: 'Assignment',
      meta: { fill: true, cellClassName: 'max-w-0' },
      accessorFn: r => r.vaName,
      cell: ({ row }) => {
        const r = row.original;
        const sub = [r.clientName, r.service].filter(Boolean).join(' · ');
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
              {initialsOf(r.vaName) || '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={r.vaName}>
                {r.vaName}
              </p>
              <p className="truncate text-xs text-muted-foreground" title={sub}>
                {sub}
                {r.blocker && (
                  <span className="text-status-warning">
                    {' · '}Blocker reported
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'today',
      header: 'Report today',
      size: 130,
      accessorFn: r => Number(r.submittedToday),
      cell: ({ row }) => <TodayPill row={row.original} />,
    },
    {
      id: 'weekHours',
      header: 'This week',
      size: 100,
      accessorFn: r => r.weekHours,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums whitespace-nowrap">
          {row.original.weekHours.toFixed(1)}h
        </span>
      ),
    },
    {
      id: 'lastReport',
      header: 'Last report',
      size: 120,
      accessorFn: r => r.lastReport ?? '',
      cell: ({ row }) =>
        row.original.lastReport ? (
          <span className="text-sm whitespace-nowrap">
            {formatDateKeyShort(row.original.lastReport)}
          </span>
        ) : (
          dash
        ),
    },
    {
      id: 'health',
      header: 'Client health',
      size: 120,
      accessorFn: r => r.health ?? '',
      cell: ({ row }) =>
        row.original.health ? <HealthBadge value={row.original.health} /> : dash,
    },
    {
      id: 'status',
      header: 'Status',
      size: 110,
      accessorFn: r => r.assignment.status,
      cell: ({ row }) => <AssignmentStatus status={row.original.assignment.status} />,
    },
  ];
}
