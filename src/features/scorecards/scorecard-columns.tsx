import type { ColumnDef } from '@tanstack/react-table';
import { StarIcon } from 'lucide-react';

import { InitialsTile } from '@/components/shared/badges';
import { formatDateKeyShort } from '@/lib/time';
import type { IScorecard } from '@/types/scorecard';

import { scoreColor } from './score';

/** Columns of the weekly scorecard table; `nameOf` gives each VA's name. */
export function buildScorecardColumns(
  nameOf: (s: IScorecard) => string
): ColumnDef<IScorecard>[] {
  return [
    {
      id: 'va',
      header: 'VA',
      meta: { fill: true, cellClassName: 'max-w-0' },
      accessorFn: s => nameOf(s),
      cell: ({ row }) => {
        const name = nameOf(row.original);
        return (
          <div className="flex min-w-0 items-center gap-3">
            <InitialsTile name={name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={name}>
                {name}
              </p>
              {row.original.companyName && (
                <p className="truncate text-xs text-muted-foreground">
                  {row.original.companyName}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'weekStart',
      header: 'Week',
      size: 130,
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {formatDateKeyShort(row.original.weekStart)} –{' '}
          {formatDateKeyShort(row.original.weekEnd)}
        </span>
      ),
    },
    {
      accessorKey: 'totalHours',
      header: 'Hours',
      size: 80,
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums">
          {getValue<number>().toFixed(1)}h
        </span>
      ),
    },
    {
      accessorKey: 'totalTasksCompleted',
      header: 'Tasks',
      size: 75,
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'eodComplianceRate',
      header: 'EOD rate',
      size: 120,
      cell: ({ getValue }) => {
        const v = getValue<number>();
        return (
          <span className={`text-sm font-medium tabular-nums ${scoreColor(v)}`}>
            {v.toFixed(0)}%
          </span>
        );
      },
    },
    {
      accessorKey: 'productivityScore',
      header: 'Score',
      size: 90,
      cell: ({ getValue }) => {
        const v = getValue<number>();
        return (
          <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
            <StarIcon
              className={`size-3.5 fill-current ${scoreColor(v)}`}
              aria-hidden
            />
            <span className="font-medium">{v.toFixed(0)}</span>
          </span>
        );
      },
    },
  ];
}
