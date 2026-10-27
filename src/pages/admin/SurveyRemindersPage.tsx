import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { BellIcon, Building2Icon, CheckIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
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
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // For AM, client-side filter by related IDs
  const reminders = useMemo(() => {
    let list = allReminders;
    if (isAccountManager && amScopedIds) {
      list = list.filter(r => amScopedIds.has(r.relatedId));
    }
    if (statusFilter !== 'all') {
      list = list.filter(r => r.status === statusFilter);
    }
    return list;
  }, [allReminders, isAccountManager, amScopedIds, statusFilter]);

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
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-xs px-2 py-0.5 rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] bg-white/[0.04] text-text-secondary whitespace-nowrap">
            {SURVEY_TYPE_LABELS[getValue<ISurveyReminder['surveyType']>()] ??
              getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'relatedType',
        header: 'For',
        size: 220,
        enableSorting: false,
        cell: ({ row }) => {
          const { relatedId, relatedType } = row.original;
          const info = relatedInfo.get(relatedId);
          const title = info?.title ?? `…${relatedId.slice(-8)}`;
          const subtitle = info?.subtitle ?? relatedType;
          return (
            <div
              className="flex max-w-[16rem] min-w-0 items-center gap-3"
              title={`${title} · ${subtitle}`}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] font-mono text-xs text-text-secondary">
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
        header: 'Due Date',
        size: 155,
        cell: ({ row, getValue }) => {
          const v = getValue<string>()?.slice(0, 10) ?? '';
          // Finished reminders are never overdue.
          const open =
            row.original.status === 'pending' || row.original.status === 'sent';
          const overdue = open && v < today;
          return (
            <span
              className={`text-xs whitespace-nowrap ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
            >
              {v}
              {overdue ? ' (overdue)' : ''}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 105,
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
        header: 'Actions',
        enableSorting: false,
        size: 96,
        cell: ({ row }) => {
          const { _id, status } = row.original;
          if (status === 'completed' || status === 'skipped') return null;
          const busy = updatingId === _id;
          return (
            <TooltipProvider delayDuration={300}>
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon" aria-label="Mark reminder as completed"
                      className="size-7 border border-status-success/30 bg-white/[0.02] text-status-success/80 hover:border-status-success/50 hover:bg-status-success/10 hover:text-status-success"
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
                      className="size-7 border border-status-error/30 bg-white/[0.02] text-status-error/80 hover:border-status-error/50 hover:bg-status-error/10 hover:text-status-error"
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Survey Reminders
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track and action scheduled check-in reminders
              </p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BellIcon className="size-4" />
              <span className="text-sm">{reminders.length} reminders</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select
                value={statusFilter}
                onValueChange={v => setStatusFilter(v as SurveyStatus | 'all')}
              >
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}
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
