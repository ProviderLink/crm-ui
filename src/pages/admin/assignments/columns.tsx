import { type ColumnDef } from '@tanstack/react-table';
import { EyeIcon, PenLineIcon, XIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type IAssignment } from '@/types/assignment';

export function buildColumns(
  clientMap: Record<string, string>,
  vaMap: Record<string, string>,
  amMap: Record<string, string>,
  onEdit: (a: IAssignment) => void,
  onDeactivate: (a: IAssignment) => void,
  canManage: boolean,
  rolePrefix: string
): ColumnDef<IAssignment>[] {
  const columns: ColumnDef<IAssignment>[] = [
    {
      id: 'assignmentId',
      accessorKey: '_id',
      header: 'ID',
      size: 130,
      cell: ({ getValue }) => {
        const full = getValue<string>() ?? '';
        const suffix = full.slice(-8);
        return (
          <span className="font-mono text-sm text-muted-foreground whitespace-nowrap">
            {suffix}
          </span>
        );
      },
    },
    {
      accessorKey: 'clientId',
      header: 'Client',
      size: 210,
      cell: ({ getValue }) =>
        clientMap[getValue<string>()] ?? getValue<string>(),
    },
    {
      accessorKey: 'candidateId',
      header: 'VA',
      size: 130,
      cell: ({ row, getValue }) =>
        row.original.candidateName ||
        vaMap[getValue<string>()] ||
        getValue<string>(),
    },
    {
      accessorKey: 'accountManagerId',
      header: 'Account Manager',
      size: 165,
      cell: ({ row, getValue }) =>
        row.original.accountManagerName ||
        amMap[getValue<string>() ?? ''] ||
        '—',
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      size: 115,
      cell: ({ getValue }) => getValue<string>()?.slice(0, 10) ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 90,
      cell: ({ getValue }) => {
        const v = getValue<string>();
        const styles =
          {
            active:
              'bg-white/[0.04] text-text-secondary ring-1 ring-[rgba(255,255,255,0.08)]',
            on_hold:
              'bg-white/[0.04] text-text-secondary ring-1 ring-[rgba(255,255,255,0.08)]',
            ended:
              'bg-white/[0.04] text-text-tertiary ring-1 ring-[rgba(255,255,255,0.08)]',
          }[v] ??
          'bg-white/[0.04] text-text-tertiary ring-1 ring-[rgba(255,255,255,0.08)]';
        return (
          <span
            className={`inline-flex items-center rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 whitespace-nowrap ${styles}`}
          >
            {v}
          </span>
        );
      },
    },
  ];

  columns.push({
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      size: 130,
      cell: ({ row }) => (
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1 whitespace-nowrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon" aria-label="View assignment details"
                  className="size-7 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                  asChild
                >
                  <Link to={`${rolePrefix}/assignments/${row.original._id}`}>
                    <EyeIcon className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">View Details</TooltipContent>
            </Tooltip>

            {canManage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon" aria-label="Edit assignment"
                  className="size-7 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                  onClick={() => onEdit(row.original)}
                >
                  <PenLineIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Edit</TooltipContent>
            </Tooltip>
            )}

            {canManage && (row.original.status !== 'ended' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon" aria-label="End assignment"
                    className="size-7 bg-destructive/[0.04] text-destructive/60 hover:text-destructive hover:bg-destructive/[0.08]"
                    onClick={() => onDeactivate(row.original)}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">End Assignment</TooltipContent>
              </Tooltip>
            ) : (
              <div className="size-7" />
            ))}
          </div>
        </TooltipProvider>
      ),
  });

  return columns;
}
