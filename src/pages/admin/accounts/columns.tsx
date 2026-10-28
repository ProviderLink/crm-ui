import { type ColumnDef } from '@tanstack/react-table';
import { BriefcaseIcon } from 'lucide-react';

import {
  ActiveBadge,
  Avatar,
  HealthBadge,
  Pill,
  Score,
  WorkloadBadge,
} from './badges';
import { type UserRow } from './types';

const dash = <span className="text-xs text-muted-foreground/50">—</span>;

/** Avatar with a name and a supporting line; the column takes the spare width. */
function identity(name: string, sub?: string | null) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium" title={name}>
          {name}
        </p>
        {sub && (
          <p className="truncate text-xs text-muted-foreground" title={sub}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

const FILL = { fill: true, cellClassName: 'max-w-0' } as const;

const statusColumn: ColumnDef<UserRow> = {
  accessorKey: 'isActive',
  header: 'Status',
  size: 110,
  cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
};

export function buildClientColumns(): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'companyName',
      header: 'Client',
      meta: FILL,
      cell: ({ row }) => identity(row.original.companyName ?? '—'),
    },
    {
      id: 'primaryContact',
      header: 'Primary contact',
      size: 240,
      enableSorting: false,
      cell: ({ row }) => {
        const { primaryContactName, primaryContactEmail } = row.original;
        if (!primaryContactName && !primaryContactEmail) return dash;
        return (
          <div className="min-w-0">
            {primaryContactName && (
              <p className="truncate text-sm">{primaryContactName}</p>
            )}
            {primaryContactEmail && (
              <p className="truncate text-xs text-muted-foreground">
                {primaryContactEmail}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'healthStatus',
      header: 'Health',
      size: 110,
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? <HealthBadge value={v} /> : dash;
      },
    },
    {
      accessorKey: 'satisfactionScore',
      header: 'Satisfaction',
      size: 120,
      cell: ({ getValue }) => <Score value={getValue<number | null>()} />,
    },
    statusColumn,
  ];
}

export function buildVaColumns(): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Virtual assistant',
      meta: FILL,
      cell: ({ row }) => identity(row.original.name, row.original.email),
    },
    {
      accessorKey: 'vaWorkload',
      header: 'Workload',
      size: 110,
      cell: ({ getValue }) => {
        const w = getValue<string | null>();
        return w ? <WorkloadBadge value={w} /> : dash;
      },
    },
    {
      accessorKey: 'vaTotalAssignments',
      header: 'Assignments',
      size: 130,
      cell: ({ row }) => {
        const total = row.original.vaTotalAssignments ?? 0;
        const clients = row.original.vaActiveClients ?? 0;
        return (
          <div className="whitespace-nowrap">
            <p className="text-sm tabular-nums">{total}</p>
            <p className="text-xs text-muted-foreground">
              {clients} active {clients === 1 ? 'client' : 'clients'}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'vaSatisfactionScore',
      header: 'Satisfaction',
      size: 120,
      cell: ({ getValue }) => <Score value={getValue<number | null>()} />,
    },
    {
      id: 'risk',
      header: 'Risk',
      size: 150,
      enableSorting: false,
      cell: ({ row }) => {
        const { vaBurnoutRisk, vaReplacementRisk } = row.original;
        if (!vaBurnoutRisk && !vaReplacementRisk)
          return <span className="text-xs text-muted-foreground">None</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {vaBurnoutRisk && <Pill tone="error">Burnout</Pill>}
            {vaReplacementRisk && <Pill tone="warning">Replace</Pill>}
          </div>
        );
      },
    },
    statusColumn,
  ];
}

export function buildAmColumns(): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Account manager',
      meta: FILL,
      cell: ({ row }) => identity(row.original.name, row.original.email),
    },
    {
      accessorKey: 'amAssignmentCount',
      header: 'Assignments',
      size: 150,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
          <BriefcaseIcon className="size-3.5 text-muted-foreground" />
          <span className="tabular-nums">
            {row.original.amAssignmentCount ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">active</span>
        </div>
      ),
    },
    statusColumn,
  ];
}

export function buildAdminColumns(): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Admin',
      meta: FILL,
      cell: ({ row }) => identity(row.original.name, row.original.email),
    },
    statusColumn,
  ];
}
