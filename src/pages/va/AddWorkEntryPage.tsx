import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useMyAssignments } from '@/hooks/useMyAssignments'
import { createWorkEntry } from '@/services/work-entries.service'
import { WORK_ENTRY_CATEGORIES, WORK_ENTRY_STATUSES } from '@/types/work-entry'
import { todayString, nowTimeString } from '@/lib/time'

const schema = z.object({
  assignment_id: z.string().min(1, 'Assignment is required'),
  entry_date: z.string().min(1, 'Date is required'),
  entry_time: z.string().min(1, 'Time is required'),
  task_category: z.enum([
    'Administrative',
    'Clinical Coordination',
    'Data Entry',
    'Communication',
    'Research',
    'Scheduling',
    'Other',
  ]),
  task_description: z.string().min(1, 'Description is required'),
  time_spent: z.coerce.number().int().min(1, 'Enter at least 1 minute'),
  status: z.enum(['completed', 'in_progress', 'pending']),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function AddWorkEntryPage() {
  const navigate = useNavigate()
  const { assignments, isLoading: loadingAssignments } = useMyAssignments()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      entry_date: todayString(),
      entry_time: nowTimeString(),
      status: 'completed',
    },
  })

  // Auto-select when only one assignment
  useEffect(() => {
    if (assignments.length === 1 && assignments[0]) {
      setValue('assignment_id', assignments[0].id)
    }
  }, [assignments, setValue])

  async function onSubmit(data: FormData) {
    try {
      await createWorkEntry(data)
      navigate('/va/work/history')
    } catch {
      // error handled below via isSubmitting state reset
    }
  }

  if (loadingAssignments) {
    return <PageSkeleton />
  }

  if (assignments.length === 0) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="max-w-2xl">
              <PageHeader />
              <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No active assignments found. Contact your account manager.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="max-w-2xl">
            <PageHeader />

            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
              >
                {/* Assignment */}
                <Field label="Assignment" error={errors.assignment_id?.message}>
                  <Controller
                    control={control}
                    name="assignment_id"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={assignments.length === 1}
                      >
                        <SelectTrigger className="rounded-xl border-input">
                          <SelectValue placeholder="Select assignment" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignments.map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.service_type ?? a.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date" error={errors.entry_date?.message}>
                    <Input
                      type="date"
                      className="rounded-xl border-input"
                      {...register('entry_date')}
                    />
                  </Field>
                  <Field label="Time" error={errors.entry_time?.message}>
                    <Input
                      type="time"
                      className="rounded-xl border-input"
                      {...register('entry_time')}
                    />
                  </Field>
                </div>

                {/* Category */}
                <Field label="Category" error={errors.task_category?.message}>
                  <Controller
                    control={control}
                    name="task_category"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="rounded-xl border-input">
                          <SelectValue placeholder="Select category" />
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
                </Field>

                {/* Description */}
                <Field
                  label="Task Description"
                  error={errors.task_description?.message}
                >
                  <Textarea
                    placeholder="What did you work on?"
                    className="rounded-xl border-input resize-none"
                    rows={3}
                    {...register('task_description')}
                  />
                </Field>

                {/* Time spent + Status */}
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Time Spent (minutes)"
                    error={errors.time_spent?.message}
                  >
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g. 60"
                      className="rounded-xl border-input"
                      {...register('time_spent')}
                    />
                  </Field>
                  <Field label="Status" error={errors.status?.message}>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="rounded-xl border-input">
                            <SelectValue placeholder="Select status" />
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
                  </Field>
                </div>

                {/* Notes */}
                <Field label="Notes (optional)" error={errors.notes?.message}>
                  <Textarea
                    placeholder="Any additional notes…"
                    className="rounded-xl border-input resize-none"
                    rows={2}
                    {...register('notes')}
                  />
                </Field>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl h-10 font-medium"
                >
                  {isSubmitting ? 'Saving…' : 'Save Work Entry'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Micro-components ─────────────────────────────────────────

import type { ReactNode } from 'react'

function PageHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-foreground">Add Work Entry</h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        Log a task you worked on today
      </p>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="max-w-2xl space-y-4">
            <div className="h-8 w-48 rounded-xl bg-muted animate-pulse" />
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
