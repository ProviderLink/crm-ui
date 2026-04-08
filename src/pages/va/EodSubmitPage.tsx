import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { useMyAssignments } from '@/hooks/useMyAssignments'
import { getEodSubmissions, createEodSubmission } from '@/services/eod-submissions.service'
import { todayString, calcHours } from '@/lib/time'
import { CheckCircle2 } from 'lucide-react'

const schema = z.object({
  assignmentId:   z.string().min(1, 'Assignment is required'),
  date:           z.string().min(1, 'Date is required'),
  shiftStart:     z.string().min(1, 'Shift start is required'),
  shiftEnd:       z.string().min(1, 'Shift end is required'),
  summaryOfWork:  z.string().min(10, 'Please provide a summary (min 10 characters)'),
  pendingTasks:   z.string().min(1, 'List pending tasks or write "None"'),
  blockers:       z.string().min(1, 'Describe blockers or write "None"'),
  notes:          z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function EodSubmitPage() {
  const navigate = useNavigate()
  const today = todayString()
  const { assignments, isLoading: loadingAssignments } = useMyAssignments()

  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [checkingEod, setCheckingEod] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register, handleSubmit, control, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: today, shiftStart: '09:00', shiftEnd: '17:00' },
  })

  const shiftStart = watch('shiftStart') ?? ''
  const shiftEnd   = watch('shiftEnd') ?? ''
  const hoursWorked = calcHours(shiftStart, shiftEnd)

  // Check if EOD already submitted today + auto-select assignment
  useEffect(() => {
    getEodSubmissions({ dateFrom: today, dateTo: today })
      .then((eods) => setAlreadySubmitted(eods.length > 0))
      .catch(() => {})
      .finally(() => setCheckingEod(false))
  }, [today])

  useEffect(() => {
    if (assignments.length === 1 && assignments[0]) {
      setValue('assignmentId', assignments[0].id)
    }
  }, [assignments, setValue])

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      await createEodSubmission({ ...data, hoursWorked })
      navigate('/va/eod/history')
    } catch {
      setError('Failed to submit EOD. Please try again.')
    }
  }

  if (loadingAssignments || checkingEod) return <PageSkeleton />

  if (assignments.length === 0) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="max-w-2xl">
              <PageHeader />
              <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
                <p className="text-sm text-muted-foreground">No active assignments found. Contact your account manager.</p>
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
                <p className="text-base font-medium text-foreground">EOD already submitted for today</p>
                <p className="text-sm text-muted-foreground">You can view it in your EOD history.</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

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
                <Select value={field.value} onValueChange={field.onChange} disabled={assignments.length === 1}>
                  <SelectTrigger className="rounded-xl border-input">
                    <SelectValue placeholder="Select assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignments.map((a) => (
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
            <Input type="date" className="rounded-xl border-input max-w-[200px]" {...register('date')} />
          </Field>

          {/* Shift times + hours */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Shift Start" error={errors.shiftStart?.message}>
              <Input type="time" className="rounded-xl border-input" {...register('shiftStart')} />
            </Field>
            <Field label="Shift End" error={errors.shiftEnd?.message}>
              <Input type="time" className="rounded-xl border-input" {...register('shiftEnd')} />
            </Field>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Hours Worked</Label>
              <div className="h-10 flex items-center px-3 rounded-xl bg-muted border border-input text-sm text-muted-foreground">
                {hoursWorked}h
              </div>
            </div>
          </div>

          {/* Summary */}
          <Field label="Summary of Work" error={errors.summaryOfWork?.message}>
            <Textarea
              placeholder="What did you accomplish today?"
              className="rounded-xl border-input resize-none"
              rows={4}
              {...register('summaryOfWork')}
            />
          </Field>

          {/* Pending tasks */}
          <Field label="Pending Tasks" error={errors.pendingTasks?.message}>
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
      <h1 className="text-2xl font-semibold text-foreground">End of Day Report</h1>
      <p className="text-sm text-muted-foreground mt-0.5">Submit your daily work summary</p>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
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
                <div key={i} className="h-10 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
