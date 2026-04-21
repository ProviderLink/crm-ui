import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { QK, useEodSubmissionsQuery } from '@/hooks/queries'
import { useMyAssignments } from '@/hooks/useMyAssignments'
import { calcHours, todayString } from '@/lib/time'
import { createEodSubmission } from '@/services/eod-submissions.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

const schema = z.object({
  assignmentId: z.string().min(1, 'Assignment is required'),
  date: z.string().min(1, 'Date is required'),
  shiftStart: z.string().min(1, 'Shift start is required'),
  shiftEnd: z.string().min(1, 'Shift end is required'),
  summaryOfWork: z
    .string()
    .min(10, 'Please provide a summary (min 10 characters)'),
  pendingTasks: z.string().min(1, 'List pending tasks or write "None"'),
  blockers: z.string().min(1, 'Describe blockers or write "None"'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function EodSubmitPage() {
  const navigate = useNavigate()
  const today = todayString()
  const {
    assignments,
    isLoading: loadingAssignments,
    isError: assignmentsError,
  } = useMyAssignments()

  const queryClient = useQueryClient()
  const { data: eods = [], isLoading: checkingEod } = useEodSubmissionsQuery()
  const submittedDates = new Set(eods.map(e => e.date.slice(0, 10)))
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: today, shiftStart: '', shiftEnd: '' },
  })

  const selectedDate = watch('date') ?? today
  const shiftStart = watch('shiftStart') ?? ''
  const shiftEnd = watch('shiftEnd') ?? ''
  const hoursWorked = calcHours(shiftStart, shiftEnd)
  const alreadySubmitted = submittedDates.has(selectedDate)

  // Auto-select when only one assignment
  useEffect(() => {
    if (assignments.length === 1 && assignments[0]) {
      setValue('assignmentId', assignments[0].id)
    }
  }, [assignments, setValue])

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      await createEodSubmission({ ...data, hoursWorked })
      queryClient.invalidateQueries({ queryKey: QK.eodSubmissions })
      toast.success('EOD report submitted.')
      navigate('/va/eod/history')
    } catch {
      setError('Failed to submit EOD. Please try again.')
      toast.error('Failed to submit EOD. Please try again.')
    }
  }

  if (loadingAssignments || checkingEod) return <PageSkeleton />

  if (assignmentsError) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="max-w-2xl">
              <PageHeader />
              <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
                <p className="text-sm text-destructive">
                  Failed to load assignments. Please refresh the page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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

  if (alreadySubmitted) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="max-w-2xl">
              <PageHeader />
              <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center space-y-3">
                <CheckCircle2 size={36} className="text-green-500 mx-auto" />
                <p className="text-base font-medium text-foreground">
                  EOD already submitted for{' '}
                  {selectedDate === today ? 'today' : selectedDate}
                </p>
                <p className="text-sm text-muted-foreground">
                  You can view it in your EOD history.
                </p>
                <button
                  onClick={() => navigate('/va/eod/history')}
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  View EOD History →
                </button>
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
                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {/* Assignment */}
                <Field label="Assignment" error={errors.assignmentId?.message}>
                  <Controller
                    control={control}
                    name="assignmentId"
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
                              {a.serviceType ?? a.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                {/* Date */}
                <Field label="Date" error={errors.date?.message}>
                  <Input
                    type="date"
                    max={today}
                    className="rounded-xl border-input max-w-[200px]"
                    {...register('date')}
                  />
                </Field>

                {/* Shift times + hours */}
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Shift Start" error={errors.shiftStart?.message}>
                    <Input
                      type="time"
                      className="rounded-xl border-input"
                      {...register('shiftStart')}
                    />
                  </Field>
                  <Field label="Shift End" error={errors.shiftEnd?.message}>
                    <Input
                      type="time"
                      className="rounded-xl border-input"
                      {...register('shiftEnd')}
                    />
                  </Field>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">
                      Hours Worked
                    </Label>
                    <div className="h-10 flex items-center px-3 rounded-xl bg-muted border border-input text-sm text-muted-foreground">
                      {hoursWorked}h
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <Field
                  label="Summary of Work"
                  error={errors.summaryOfWork?.message}
                >
                  <Textarea
                    placeholder="What did you accomplish today?"
                    className="rounded-xl border-input resize-none"
                    rows={4}
                    {...register('summaryOfWork')}
                  />
                </Field>

                {/* Pending tasks */}
                <Field
                  label="Pending Tasks"
                  error={errors.pendingTasks?.message}
                >
                  <Textarea
                    placeholder="List pending tasks or write 'None'"
                    className="rounded-xl border-input resize-none"
                    rows={3}
                    {...register('pendingTasks')}
                  />
                </Field>

                {/* Blockers */}
                <Field label="Blockers" error={errors.blockers?.message}>
                  <Textarea
                    placeholder="Describe blockers or write 'None'"
                    className="rounded-xl border-input resize-none"
                    rows={2}
                    {...register('blockers')}
                  />
                </Field>

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
                  {isSubmitting ? 'Submitting…' : 'Submit EOD'}
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

function PageHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-foreground">
        End of Day Report
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        Submit your daily work summary
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
              {Array.from({ length: 6 }).map((_, i) => (
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
