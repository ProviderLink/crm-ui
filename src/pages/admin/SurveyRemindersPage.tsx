import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { BellIcon, CheckIcon, XIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { QK, useSurveyRemindersQuery } from '@/hooks/queries'
import { todayString } from '@/lib/time'
import { updateSurveyReminder } from '@/services/survey-reminders.service'
import type { ISurveyReminder, SurveyStatus } from '@/types/survey-reminder'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SURVEY_TYPE_LABELS: Record<ISurveyReminder['surveyType'], string> = {
  '3_day': '3-Day',
  '1_week': '1-Week',
  '30_day': '30-Day',
  monthly: 'Monthly',
}

const STATUS_STYLES: Record<SurveyStatus, string> = {
  pending:
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  sent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  completed:
    'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  skipped: 'bg-muted text-muted-foreground border-border',
}

const todayStr = () => todayString()

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SurveyRemindersPage() {
  const queryClient = useQueryClient()
  const { data: reminders = [], isLoading } = useSurveyRemindersQuery()
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | 'all'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? reminders
        : reminders.filter(r => r.status === statusFilter),
    [reminders, statusFilter]
  )

  async function handleUpdateStatus(id: string, status: SurveyStatus) {
    setUpdatingId(id)
    setUpdateError(null)
    try {
      await updateSurveyReminder(id, {
        status,
        ...(status === 'completed' ? { completedDate: todayStr() } : {}),
      })
      queryClient.invalidateQueries({ queryKey: QK.surveyReminders })
      toast.success('Reminder status updated.')
    } catch {
      setUpdateError('Failed to update status. Please try again.')
      toast.error('Failed to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const columns = useMemo<ColumnDef<ISurveyReminder>[]>(
    () => [
      {
        accessorKey: 'surveyType',
        header: 'Survey',
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary whitespace-nowrap">
            {SURVEY_TYPE_LABELS[getValue<ISurveyReminder['surveyType']>()]}
          </span>
        ),
      },
      {
        accessorKey: 'relatedType',
        header: 'For',
        size: 160,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground capitalize">
            {row.original.relatedType} ·{' '}
            <span className="font-mono">
              {row.original.relatedId.slice(-8)}
            </span>
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        size: 155,
        cell: ({ getValue }) => {
          const v = getValue<string>()?.slice(0, 10) ?? ''
          const overdue = v < todayStr()
          return (
            <span
              className={`text-xs whitespace-nowrap ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
            >
              {v}
              {overdue ? ' (overdue)' : ''}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 105,
        cell: ({ getValue }) => {
          const s = getValue<SurveyStatus>()
          return (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border capitalize whitespace-nowrap ${STATUS_STYLES[s]}`}
            >
              {s}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        size: 80,
        cell: ({ row }) => {
          const { id, status } = row.original
          if (status === 'completed' || status === 'skipped') return null
          const busy = updatingId === id
          return (
            <TooltipProvider delayDuration={300}>
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 bg-green-500/[0.04] text-green-500/60 hover:text-green-500 hover:bg-green-500/[0.08]"
                      disabled={busy}
                      onClick={() => handleUpdateStatus(id, 'completed')}
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
                      className="size-7 bg-white/[0.02] text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.05]"
                      disabled={busy}
                      onClick={() => handleUpdateStatus(id, 'skipped')}
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Skip</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          )
        },
      },
    ],
    [updatingId] // eslint-disable-line react-hooks/exhaustive-deps
  )

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
              <span className="text-sm">{filtered.length} reminders</span>
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
          <DataTable columns={columns} data={filtered} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
