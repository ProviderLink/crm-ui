import { type ColumnDef } from '@tanstack/react-table';
import { AlertTriangleIcon, BriefcaseIcon, CheckCircle2Icon, EyeIcon, FlameIcon, StarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActiveBadge } from './badges';
import { type UserRow } from './types';

const healthStyle: Record<string, string> = {
  green: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  red: 'bg-red-500/10 text-red-400 ring-red-500/20',
};
const healthLabel: Record<string, string> = {
  green: 'Healthy',
  yellow: 'At Risk',
  red: 'Critical',
};

export function buildClientColumns(
  onView: (u: UserRow) => void
): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'companyName',
      header: 'Client',
      cell: ({ row }) => {
        const { companyName } = row.original;
        const initials = (companyName ?? '?')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-text-secondary font-mono text-xs">
              {initials}
            </div>
            <p className="text-sm font-semibold truncate">
              {companyName ?? '—'}
            </p>
          </div>
        );
      },
    },
    {
      id: 'primaryContact',
      header: 'Primary Contact',
      cell: ({ row }) => {
        const { primaryContactName, primaryContactEmail } = row.original;
        if (!primaryContactName && !primaryContactEmail)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="min-w-0">
            {primaryContactName && (
              <p className="text-sm font-medium truncate">
                {primaryContactName}
              </p>
            )}
            {primaryContactEmail && (
              <p className="text-xs text-muted-foreground truncate">
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
      cell: ({ getValue }) => {
        const val = getValue<string | null>();
        if (!val)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${healthStyle[val] ?? healthStyle.green}`}
          >
            {healthLabel[val] ?? val}
          </span>
        );
      },
    },
    {
      accessorKey: 'satisfactionScore',
      header: 'Satisfaction',
      cell: ({ getValue }) => {
        const score = getValue<number | null>();
        if (score == null)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={`size-3 ${i < score ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`}
              />
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs rounded-lg gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => onView(row.original)}
        >
          <EyeIcon className="size-3.5" />
          View Details
        </Button>
      ),
    },
  ];
}

const workloadStyle: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  normal: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  high: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  overloaded: 'bg-red-500/10 text-red-400 ring-red-500/20',
};

export function buildVaColumns(onView: (u: UserRow) => void): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Virtual Assistant',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-text-secondary font-mono text-xs font-medium">
              {u.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight truncate">
                {u.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {u.email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'vaWorkload',
      header: 'Workload',
      cell: ({ row }) => {
        const w = row.original.vaWorkload;
        if (!w) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${workloadStyle[w] ?? 'bg-white/[0.04] text-muted-foreground ring-white/[0.08]'}`}
          >
            {w.charAt(0).toUpperCase() + w.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: 'vaTotalAssignments',
      header: 'Assignments',
      cell: ({ row }) => {
        const total = row.original.vaTotalAssignments ?? 0;
        const clients = row.original.vaActiveClients ?? 0;
        return (
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold tabular-nums">
              {total}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {clients} {clients === 1 ? 'client' : 'clients'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'vaSatisfactionScore',
      header: 'Satisfaction',
      cell: ({ row }) => {
        const score = row.original.vaSatisfactionScore;
        if (score == null)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={`size-3 ${i < score ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`}
              />
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'vaBurnoutRisk',
      header: 'Risk',
      cell: ({ row }) => {
        const burnout = row.original.vaBurnoutRisk;
        const replacement = row.original.vaReplacementRisk;
        if (!burnout && !replacement) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2Icon className="size-3" />
              Clear
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {burnout && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20">
                <FlameIcon className="size-2.5" />
                Burnout
              </span>
            )}
            {replacement && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20">
                <AlertTriangleIcon className="size-2.5" />
                Replace
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    },
    {
      id: 'actions',
      header: '',
      size: 120,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-lg text-xs gap-1.5"
          onClick={() => onView(row.original)}
        >
          <EyeIcon className="size-3" />
          View Details
        </Button>
      ),
    },
  ];
}

export function buildAmColumns(): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Account Manager',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-text-secondary font-mono text-xs font-medium">
              {u.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <p className="text-sm font-medium leading-tight truncate">
              {u.name}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'amAssignmentCount',
      header: 'Assignments',
      cell: ({ row }) => {
        const count = row.original.amAssignmentCount ?? 0;
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <BriefcaseIcon className="size-3.5 text-muted-foreground" />
            <span className="font-medium tabular-nums">{count}</span>
            <span className="text-muted-foreground text-xs">active</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    },
  ];
}

export function buildAdminColumns(): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Admin',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-text-secondary font-mono text-xs font-medium">
              {u.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <p className="text-sm font-medium leading-tight truncate">
              {u.name}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => <ActiveBadge active={getValue<boolean>()} />,
    },
  ];
}
