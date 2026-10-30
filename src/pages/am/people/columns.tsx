import type { ColumnDef } from '@tanstack/react-table';

import { dateKeyToLocalDate, formatDateKeyShort } from '@/lib/time';

import {
  buildClientColumns,
  buildVaColumns,
} from '../../admin/accounts/columns';
import type { UserRow } from '../../admin/accounts/types';

const MS_PER_DAY = 86_400_000;
const STALE_DAYS = 30;

/** Whole days since a `YYYY-MM-DD` (or ISO) date; null when it is missing. */
function daysSince(value?: string | null): number | null {
  const date = value ? dateKeyToLocalDate(value) : null;
  if (!date) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today.getTime() - date.getTime()) / MS_PER_DAY);
}

const ago = (days: number) =>
  days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;

// The AM list shows when someone was last spoken to, not an Active column.
const lastCheckinColumn: ColumnDef<UserRow> = {
  id: 'lastCheckin',
  header: 'Last check-in',
  size: 140,
  accessorFn: r => r.lastCheckin?.slice(0, 10) ?? '',
  cell: ({ row }) => {
    const key = row.original.lastCheckin?.slice(0, 10);
    const days = daysSince(key);
    if (!key || days === null)
      return <span className="text-sm text-status-warning">Never</span>;
    return (
      <div className="whitespace-nowrap">
        <p className="text-sm">{formatDateKeyShort(key)}</p>
        <p
          className={`text-xs ${days > STALE_DAYS ? 'text-status-warning' : 'text-muted-foreground'}`}
        >
          {ago(days)}
        </p>
      </div>
    );
  },
};

const withoutStatus = (cols: ColumnDef<UserRow>[]) =>
  cols.filter(c => (c as { accessorKey?: string }).accessorKey !== 'isActive');

export const buildAmClientColumns = (): ColumnDef<UserRow>[] => [
  ...withoutStatus(buildClientColumns()),
  lastCheckinColumn,
];

export const buildAmVaColumns = (): ColumnDef<UserRow>[] => [
  ...withoutStatus(buildVaColumns()),
  lastCheckinColumn,
];

/** How much an account needs the manager's attention; higher comes first. */
export function attentionScore(r: UserRow): number {
  if (r.role === 'client')
    return r.healthStatus === 'red' ? 2 : r.healthStatus === 'yellow' ? 1 : 0;
  return (r.vaBurnoutRisk ? 2 : 0) + (r.vaReplacementRisk ? 1 : 0);
}
