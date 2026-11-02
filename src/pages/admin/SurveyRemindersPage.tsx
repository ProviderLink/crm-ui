import type { ColumnDef } from '@tanstack/react-table';
import { CheckIcon, XIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Page, PageHeader, PageSection } from '@/components/shared/PageLayout';
import {
  ClearFiltersButton,
  SearchInput,
} from '@/components/shared/FilterControls';
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
import { useUpdateSurveyReminder } from '@/hooks/mutations';
import {
  useAllAssignmentsQuery,
  useAtsClientsQuery,
  useAtsVAsQuery,
  useCompanyDay,
  useSurveyRemindersQuery,
} from '@/hooks/queries';
import { isOpen } from '@/lib/survey';
import {
  SURVEY_TYPE_LABELS,
  type ISurveyReminder,
  type SurveyStatus,
} from '@/types/survey-reminder';
import { SurveyStatusPill } from '@/components/shared/badges';
import {
  ReminderDueCell,
  ReminderForCell,
  type RelatedInfo,
} from '@/features/reminders/reminder-cells';

export default function SurveyRemindersPage() {
  const { data: assignments = [] } = useAllAssignmentsQuery();
  const {
    data: allReminders = [],
    isLoading,
    isError,
    error,
  } = useSurveyRemindersQuery();
  // Due dates are company business days, so judge "overdue" against the
  // company's current day, not the device clock.
  const { today } = useCompanyDay();
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
    for (const a of assignments) {
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
  }, [atsVAs, atsClients, assignments]);
  const [statusFilter, setStatusFilter] = useState<
    SurveyStatus | 'overdue' | 'all'
  >('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const update = useUpdateSurveyReminder(
    'Failed to update status. Please try again.'
  );
  const updateError = update.error;

  const isOverdue = useCallback(
    (r: ISurveyReminder) =>
      isOpen(r) && (r.dueDate?.slice(0, 10) ?? '') < today,
    [today]
  );
  const overdueCount = allReminders.filter(isOverdue).length;

  // Open reminders first (soonest due first, so overdue leads), finished ones last.
  const reminders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = allReminders.filter(r => {
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
  }, [allReminders, statusFilter, search, relatedInfo, isOverdue]);

  const { run: runUpdate } = update;
  const handleUpdateStatus = useCallback(
    async (id: string, status: SurveyStatus) => {
      setUpdatingId(id);
      await runUpdate({ id, status });
      setUpdatingId(null);
    },
    [runUpdate]
  );

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
        cell: ({ row }) => (
          <ReminderForCell
            reminder={row.original}
            info={relatedInfo.get(row.original.relatedId)}
          />
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due date',
        size: 160,
        cell: ({ row }) => (
          <ReminderDueCell reminder={row.original} today={today} />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 110,
        cell: ({ getValue }) => {
          const s = getValue<SurveyStatus>();
          return <SurveyStatusPill status={s} />;
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
                      size="icon"
                      aria-label="Mark reminder as completed"
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
                      size="icon"
                      aria-label="Skip reminder"
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
    [updatingId, relatedInfo, today, handleUpdateStatus]
  );

  return (
    <Page>
      <PageSection>
        <PageHeader
          title="Survey Reminders"
          description="Track and action scheduled check-in reminders"
        />

        {/* Search + filter */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search VA or client…"
            label="Search by VA or client"
          />
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
            <ClearFiltersButton
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
            />
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
        <DataTable
          columns={columns}
          data={reminders}
          isLoading={isLoading}
          isError={isError}
          error={error}
        />
      </PageSection>
    </Page>
  );
}
