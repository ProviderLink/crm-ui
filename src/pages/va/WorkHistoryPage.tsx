import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { PenLineIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { QK, useAtsClientsQuery, useWorkEntriesQuery } from '@/hooks/queries'
import { formatMinutes } from '@/lib/time'
import { updateWorkEntry } from '@/services/work-entries.service'
import {
  WORK_ENTRY_CATEGORIES,
  WORK_ENTRY_STATUSES,
  type IWorkEntry,
  type WorkEntryStatus,
} from '@/types/work-entry'

// ── Edit schema ───────────────────────────────────────────────────────────────

const editSchema = z.object({
  entryDate: z.string().min(1, 'Required'),
  entryTime: z.string().min(1, 'Required'),
  taskCategory: z.enum([
    'Administrative',
    'Clinical Coordination',
    'Data Entry',
    'Communication',
    'Research',
    'Scheduling',
    'Other',
  ]),
  taskDescription: z.string().min(1, 'Required'),
  timeSpent: z.number().int().min(1, 'At least 1 minute'),
  status: z.enum(['completed', 'in_progress', 'pending']),
  notes: z.string().optional(),
})
type EditFormData = z.infer<typeof editSchema>

// ── Status styles ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<WorkEntryStatus, string> = {
  completed:
    'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  in_progress:
    'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  pending: 'bg-muted text-muted-foreground border-border',
}

// ── Edit sheet form ──────────────────────────────────────────────────────────

function EditWorkEntryForm({
  entry,
  onSuccess,
}: {
  entry: IWorkEntry
  onSuccess: () => void
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      entryDate: entry.entryDate?.slice(0, 10) ?? '',
      entryTime: entry.entryTime ?? '',
      taskCategory: entry.taskCategory,
      taskDescription: entry.taskDescription,
      timeSpent: entry.timeSpent,
      status: entry.status,
      notes: entry.notes ?? '',
    },
  })

  const [serverError, setServerError] = useState('')

  useEffect(() => {
    reset({
      entryDate: entry.entryDate?.slice(0, 10) ?? '',
      entryTime: entry.entryTime ?? '',
      taskCategory: entry.taskCategory,
      taskDescription: entry.taskDescription,
      timeSpent: entry.timeSpent,
      status: entry.status,
      notes: entry.notes ?? '',
    })
  }, [entry, reset])

  async function onSubmit(data: EditFormData) {
    setServerError('')
    try {
      await updateWorkEntry(entry.id, data)
      onSuccess()
    } catch {
      setServerError('Failed to save. Please try again.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 flex flex-col gap-5 pb-6"
    >
      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Date</Label>
          <Controller
            name="entryDate"
            control={control}
            render={({ field }) => (
              <DatePickerField
                value={field.value}
                onChange={field.onChange}
                toDate={new Date()}
              />
            )}
          />
          {errors.entryDate && (
            <p className="text-xs text-destructive">
              {errors.entryDate.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Time</Label>
          <Input
            type="time"
            {...register('entryTime')}
            className="rounded-md border-input"
          />
          {errors.entryTime && (
            <p className="text-xs text-destructive">
              {errors.entryTime.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Category</Label>
        <Controller
          control={control}
          name="taskCategory"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="rounded-md border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORK_ENTRY_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.taskCategory && (
          <p className="text-xs text-destructive">
            {errors.taskCategory.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Task Description</Label>
        <Textarea
          {...register('taskDescription')}
          rows={3}
          className="rounded-md border-input resize-none"
        />
        {errors.taskDescription && (
          <p className="text-xs text-destructive">
            {errors.taskDescription.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Time Spent (minutes)</Label>
          <Input
            type="number"
            min={1}
            {...register('timeSpent', { valueAsNumber: true })}
            className="rounded-md border-input"
          />
          {errors.timeSpent && (
            <p className="text-xs text-destructive">
              {errors.timeSpent.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="rounded-md border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_ENTRY_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>
                      {s
                        .replace('_', ' ')
                        .replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Notes (optional)</Label>
        <Textarea
          {...register('notes')}
          rows={2}
          className="rounded-md border-input resize-none"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WorkHistoryPage() {
  const queryClient = useQueryClient()
  const { data: entries = [], isLoading } = useWorkEntriesQuery()
  const { data: atsClients = [] } = useAtsClientsQuery()

  const clientMap = useMemo(() => {
    const m = new Map<string, string>()
    atsClients.forEach(c => m.set(c.id, c.companyName))
    return m
  }, [atsClients])
  const [dateFrom, setDateFrom] = useState(
    () =>
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
  )
  const [dateTo, setDateTo] = useState(
    () => new Date().toISOString().split('T')[0]
  )
  const [editEntry, setEditEntry] = useState<IWorkEntry | null>(null)

  const filtered = useMemo(
    () =>
      entries.filter(e => {
        if (dateFrom && e.entryDate < dateFrom) return false
        if (dateTo && e.entryDate > dateTo) return false
        return true
      }),
    [entries, dateFrom, dateTo]
  )

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
  }

  const columns = useMemo<ColumnDef<IWorkEntry>[]>(
    () => [
      {
        accessorKey: 'clientId',
        header: 'Client',
        size: 180,
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-foreground">
            {clientMap.get(getValue<string>()) ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'entryDate',
        header: 'Date',
        size: 105,
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {getValue<string>()?.slice(0, 10)}
          </span>
        ),
      },
      {
        accessorKey: 'entryTime',
        header: 'Time',
        size: 75,
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'taskCategory',
        header: 'Category',
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary whitespace-nowrap">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'taskDescription',
        header: 'Description',
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'timeSpent',
        header: 'Time Spent',
        size: 95,
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatMinutes(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 125,
        cell: ({ getValue }) => {
          const s = getValue<WorkEntryStatus>()
          return (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLES[s]}`}
            >
              {s.replace('_', ' ')}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        size: 60,
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                onClick={() => setEditEntry(row.original)}
              >
                <PenLineIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Edit</TooltipContent>
          </Tooltip>
        ),
      },
    ],
    [setEditEntry, clientMap]
  )

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Work History
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                All your logged work entries
              </p>
            </div>
            <Link
              to="/va/work/new"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity"
            >
              + Add Entry
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From</span>
              <DatePickerField
                value={dateFrom}
                onChange={v => setDateFrom(v)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To</span>
              <DatePickerField value={dateTo} onChange={v => setDateTo(v)} />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} records
            </span>
          </div>

          <DataTable columns={columns} data={filtered} isLoading={isLoading} />
        </div>
      </div>

      <Sheet
        open={editEntry !== null}
        onOpenChange={o => !o && setEditEntry(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Work Entry</SheetTitle>
            <SheetDescription>
              {editEntry ? editEntry.entryDate?.slice(0, 10) : ''}
            </SheetDescription>
          </SheetHeader>
          {editEntry && (
            <EditWorkEntryForm
              key={editEntry.id}
              entry={editEntry}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: QK.workEntries })
                setEditEntry(null)
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
