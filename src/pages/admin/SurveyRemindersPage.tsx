import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Building2Icon,
  CheckIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  QK,
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useAtsVAsQuery,
  useEodContextQuery,
  useSurveyRemindersQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { todayString } from '@/lib/time';
import { updateSurveyReminder } from '@/services/survey-reminders.service';
import type { ISurveyReminder, SurveyStatus } from '@/types/survey-reminder';
import { SURVEY_STATUS_STYLES } from '@/lib/status-styles';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SURVEY_TYPE_LABELS: Record<ISurveyReminder['surveyType'], string> = {
  '3_day': '3-Day',
  '1_week': '1-Week',
  '30_day': '30-Day',
  monthly: 'Monthly',
};

interface RelatedInfo {
  title: string;
  subtitle: string;
  isCompany: boolean;
}

const isOpen = (r: ISurveyReminder) =>
  r.status === 'pending' || r.status === 'sent';

// Whole days from `today` to `due` (both YYYY-MM-DD); negative when past.
function daysUntil(due: string, today: string) {
  const [dy, dm, dd] = due.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return Math.round(
    (Date.UTC(dy!, dm! - 1, dd) - Date.UTC(ty!, tm! - 1, td)) / 86_400_000
  );
}

function shortDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SurveyRemindersPage() {
  const queryClient = useQueryClient();
  const user = useAppSelector(s => s.auth.user);
  const isAccountManager = user?.role === 'account_manager';

  // AM scoping: only see reminders for their own assignments' clients/VAs/assignments
  const { data: amAssignments = [] } = useAllAssignmentsQuery(
    isAccountManager ? user?.id : undefined
  );
  const amScopedIds = useMemo(() => {
    if (!isAccountManager) return null;
    const ids = new Set<string>();
    for (const a of amAssignments) {
      ids.add(a._id); // assignment IDs
      if (a.candidateId) ids.add(a.candidateId); // VA IDs
      if (a.clientId) ids.add(a.clientId); // client IDs
    }
    return ids;
  }, [isAccountManager, amAssignments]);

  const { data: allReminders = [], isLoading } = useSurveyRemindersQuery();
  // Due dates are company business days, so judge "overdue" against the
  // company's current day, not the device clock.
  const { data: eodContext } = useEodContextQuery();
  const today = eodContext?.dateKey ?? todayString();
  const { data: atsVAs = [] } = useAtsVAsQuery();
  const { data: atsClients = [] } = useAtsClientsQuery();

  // What the "For" column shows for each related record: a main line and a
  // supporting line, so it reads as people and companies, not ids.
  const relatedInfo = useMemo(() => {
    const info = new Map<string, RelatedInfo>();
    for (const v of atsVAs)
      info.set(v.id, {
        title: `${v.firstName} ${v.lastName}`,
        subtitle: 'Virtual Assistant',
        isCompany: false,
      });
    for (const c of atsClients)
      info.set(c.id, {
        title: c.companyName,
        subtitle: 'Client',
        isCompany: true,
      });
    // An assignment is shown by its VA, with the client underneath.
    for (const a of amAssignments) {
      const va = info.get(a.candidateId);
      const client = info.get(a.clientId);
      if (va || client) {
        info.set(a._id, {
          title: va?.title ?? client?.title ?? '',
          subtitle: va && client ? client.title : 'Assignment',
          isCompany: !va,
        });
      }
    }
    return info;
  }, [atsVAs, atsClients, amAssignments]);
  const [statusFilter, setStatusFilter] = useState<
    SurveyStatus | 'overdue' | 'all'
  >('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // For AM, client-side filter by related IDs
  const scoped = useMemo(
    () =>
      isAccountManager && amScopedIds
        ? allReminders.filter(r => amScopedIds.has(r.relatedId))
        : allReminders,
    [allReminders, isAccountManager, amScopedIds]
  );

  const isOverdue = (r: ISurveyReminder) =>
    isOpen(r) && (r.dueDate?.slice(0, 10) ?? '') < today;
  const overdueCount = scoped.filter(isOverdue).length;

  // Open reminders first (soonest due first, so overdue leads), finished ones last.
  const reminders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = scoped.filter(r => {
      if (statusFilter === 'overdue') {
        if (!isOverdue(r)) return false;
      } else if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      const info = relatedInfo.get(r.relatedId);
      return `${info?.title ?? ''} ${info?.subtitle ?? ''}`
        .toLowerCase()
        .includes(query);
    });
    return list.sort((a, b) => {
      if (isOpen(a) !== isOpen(b)) return isOpen(a) ? -1 : 1;
      const cmp = (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
      return isOpen(a) ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, statusFilter, search, relatedInfo, today]);

  async function handleUpdateStatus(id: string, status: SurveyStatus) {
    setUpdatingId(id);
    setUpdateError(null);
    try {
      await updateSurveyReminder(id, {
        status,
        ...(status === 'completed'
          ? { completedDate: new Date().toISOString() }
          : {}),
      });
      queryClient.invalidateQueries({ queryKey: QK.surveyReminders });
    } catch {
      setUpdateError('Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  const columns = useMemo<ColumnDef<ISurveyReminder>[]>(
    () => [
      {
        accessorKey: 'surveyType',
        header: 'Survey',
        size: 90,
        cell: ({ getValue }) => (
          <span className="text-sm whitespace-nowrap">
            {SURVEY_TYPE_LABELS[getValue<ISurveyReminder['surveyType']>()] ??
              getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'relatedType',
        header: () => <span className="normal-case">For</span>,
        // Takes all the spare width; long names truncate inside it.
        meta: { fill: true, cellClassName: 'max-w-0' },
        enableSorting: false,
        cell: ({ row }) => {
          const { relatedId, relatedType } = row.original;
          const info = relatedInfo.get(relatedId);
          const title = info?.title ?? `…${relatedId.slice(-8)}`;
          const subtitle = info?.subtitle ?? relatedType;
          return (
            <div
              className="flex min-w-0 items-center gap-3"
              title={`${title} · ${subtitle}`}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-xs font-medium text-text-secondary">
                {info && !info.isCompany ? (
                  initialsOf(info.title) || '?'
                ) : (
                  <Building2Icon className="size-3.5" />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={`truncate text-sm font-medium ${info ? '' : 'font-mono'}`}
                >
                  {title}
                </p>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {subtitle}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'dueDate',
        header: 'Due date',
        size: 160,
        cell: ({ row, getValue }) => {
          const v = getValue<string>()?.slice(0, 10) ?? '';
          if (!v) return <span className="text-muted-foreground/40">—</span>;
          let note: string | null = null;
          let noteClass = 'text-muted-foreground';
          if (isOpen(row.original)) {
            const d = daysUntil(v, today);
            if (d < 0) {
              note = `Overdue by ${plural(-d, 'day')}`;
              noteClass = 'text-destructive';
            } else if (d === 0) {
              note = 'Due today';
              noteClass = 'text-status-warning';
            } else {
              note = `In ${plural(d, 'day')}`;
            }
          }
          return (
            <div className="whitespace-nowrap">
              <p className="text-sm">{shortDate(v)}</p>
              {note && <p className={`text-xs ${noteClass}`}>{note}</p>}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 110,
        cell: ({ getValue }) => {
          const s = getValue<SurveyStatus>();
          return (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border capitalize whitespace-nowrap ${SURVEY_STATUS_STYLES[s]}`}
            >
              {s}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        meta: { shrink: true },
        cell: ({ row }) => {
          const { _id, status } = row.original;
          if (status === 'completed' || status === 'skipped') return null;
          const busy = updatingId === _id;
          return (
            <TooltipProvider delayDuration={300}>
              <div className="flex items-center justify-end gap-0.5 whitespace-nowrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon" aria-label="Mark reminder as completed"
                      className="size-8 text-muted-foreground hover:bg-status-success/10 hover:text-status-success"
                      disabled={busy}
                      onClick={() => handleUpdateStatus(_id, 'completed')}
                    >
                      <CheckIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Mark as completed</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon" aria-label="Skip reminder"
                      className="size-8 text-muted-foreground hover:bg-status-error/10 hover:text-status-error"
                      disabled={busy}
                      onClick={() => handleUpdateStatus(_id, 'skipped')}
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Skip</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          );
        },
      },
    ],
    [updatingId, relatedInfo, today] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Survey Reminders
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track and action scheduled check-in reminders
            </p>
          </div>

          {/* Search + filter */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search VA or client…"
                aria-label="Search by VA or client"
                className="h-8 pl-8 text-sm"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={v =>
                setStatusFilter(v as SurveyStatus | 'overdue' | 'all')
              }
            >
              <SelectTrigger
                className="h-8 w-40 text-sm"
                aria-label="Filter by status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="overdue">
                  Overdue{overdueCount > 0 && ` (${overdueCount})`}
                </SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
            {(search || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <XIcon className="size-3.5" />
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}
              {overdueCount > 0 && statusFilter !== 'overdue' && (
                <span className="text-destructive">
                  {' '}
                  · {overdueCount} overdue
                </span>
              )}
            </span>
          </div>

          {updateError && (
            <p className="mb-2 text-sm text-destructive">{updateError}</p>
          )}
          <DataTable columns={columns} data={reminders} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
