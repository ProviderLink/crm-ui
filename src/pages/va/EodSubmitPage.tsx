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
import { Textarea } from '@/components/ui/textarea'
import { TimePickerField } from '@/components/ui/time-picker-field'
import { QK, useEodSubmissionsQuery } from '@/hooks/queries'
import { useMyAssignments } from '@/hooks/useMyAssignments'
import { calcHours, todayString } from '@/lib/time'
import { createEodSubmission } from '@/services/eod-submissions.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  StickyNote,
} from 'lucide-react'
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
      navigate('/va/eod/history')
    } catch {
      setError('Failed to submit EOD. Please try again.')
    }
  }

  if (loadingAssignments || checkingEod) return <PageSkeleton />

  if (assignmentsError) {
    return (
      <PageShell>
        <PageHeader />
        <EmptyCard>
          <p className="text-sm text-destructive">
            Failed to load assignments. Please refresh the page.
          </p>
        </EmptyCard>
      </PageShell>
    )
  }

  if (assignments.length === 0) {
    return (
      <PageShell>
        <PageHeader />
        <EmptyCard>
          <p className="text-sm text-muted-foreground">
            No active assignments found. Contact your account manager.
          </p>
        </EmptyCard>
      </PageShell>
    )
  }

  if (alreadySubmitted) {
    return (
      <PageShell>
        <PageHeader />
        <div className="bg-card rounded-2xl border border-border shadow-sm p-10 flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              EOD already submitted for{' '}
              {selectedDate === today ? 'today' : selectedDate}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You're all done for the day. Great work!
            </p>
          </div>
          <button
            onClick={() => navigate('/va/eod/history')}
            className="text-sm text-primary hover:underline underline-offset-4"
          >
            View EOD History →
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Section: Assignment ── */}
        <Section icon={<Briefcase size={14} />} title="Assignment">
          <Field label="Assigned Role" error={errors.assignmentId?.message}>
            <Controller
              control={control}
              name="assignmentId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={assignments.length === 1}
                >
                  <SelectTrigger className="rounded-xl border-input h-10">
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
        </Section>

        {/* ── Section: Shift ── */}
        <Section icon={<CalendarDays size={14} />} title="Shift">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Date" error={errors.date?.message}>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    toDate={new Date()}
                  />
                )}
              />
            </Field>
            <Field label="Shift Start" error={errors.shiftStart?.message}>
              <Controller
                name="shiftStart"
                control={control}
                render={({ field }) => (
                  <TimePickerField
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field label="Shift End" error={errors.shiftEnd?.message}>
              <Controller
                name="shiftEnd"
                control={control}
                render={({ field }) => (
                  <TimePickerField
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
          </div>

          {/* Hours worked pill */}
          {hoursWorked > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/60 border border-border/50 w-fit">
              <Clock size={13} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {hoursWorked}h
              </span>
              <span className="text-xs text-muted-foreground">total hours</span>
            </div>
          )}
        </Section>

        {/* ── Section: Work Summary ── */}
        <Section icon={<ClipboardList size={14} />} title="Work Summary">
          <Field
            label="What did you accomplish today?"
            error={errors.summaryOfWork?.message}
            hint="Include key tasks, outcomes, and any notable progress made."
          >
            <Textarea
              placeholder="e.g. Completed appointment scheduling for 15 patients, processed 32 inbox emails, resolved 2 urgent pre-auth requests…"
              className="rounded-xl border-input resize-none"
              rows={4}
              {...register('summaryOfWork')}
            />
          </Field>

          <Field
            label="Pending Tasks"
            error={errors.pendingTasks?.message}
            hint='Tasks carrying over to tomorrow. Write "None" if everything is resolved.'
          >
            <Textarea
              placeholder="e.g. Follow up on 2 insurance pre-auth requests. Or: None"
              className="rounded-xl border-input resize-none"
              rows={3}
              {...register('pendingTasks')}
            />
          </Field>

          <Field
            label="Blockers"
            error={errors.blockers?.message}
            hint='Anything preventing you from moving forward? Write "None" if clear.'
          >
            <Textarea
              placeholder="e.g. Waiting on client response for appointment confirmation. Or: None"
              className="rounded-xl border-input resize-none"
              rows={2}
              {...register('blockers')}
            />
          </Field>
        </Section>

        {/* ── Section: Notes (optional) ── */}
        <Section icon={<StickyNote size={14} />} title="Notes" optional>
          <Field label="" error={errors.notes?.message}>
            <Textarea
              placeholder="Additional context, links, or anything else worth noting…"
              className="rounded-xl border-input resize-none"
              rows={2}
              {...register('notes')}
            />
          </Field>
        </Section>

        {/* ── Actions ── */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl h-10 font-medium gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                Submit EOD Report
              </>
            )}
          </Button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border hover:border-input transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </PageShell>
  )
}

// ─── Shared layout pieces ──────────────────────────────────────

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="max-w-2xl">{children}</div>
        </div>
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardList size={18} className="text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">
          End of Day Report
        </h1>
      </div>
      <p className="text-sm text-muted-foreground ml-7">
        Submit your daily work summary to keep your team updated
      </p>
    </div>
  )
}

function Section({
  icon,
  title,
  optional = false,
  children,
}: {
  icon: ReactNode
  title: string
  optional?: boolean
  children: ReactNode
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border/60 bg-muted/30">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {optional && (
          <span className="ml-auto text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Optional
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <Label className="text-sm font-medium text-foreground block mb-1">
          {label}
        </Label>
      )}
      {hint && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {hint}
        </p>
      )}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
      {children}
    </div>
  )
}

function PageSkeleton() {
  return (
    <PageShell>
      <div className="mb-5 space-y-2">
        <div className="h-6 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded-lg bg-muted animate-pulse" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card rounded-2xl border border-border mb-4">
          <div className="h-10 border-b border-border bg-muted/30 rounded-t-2xl animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-10 rounded-xl bg-muted animate-pulse" />
            <div className="h-20 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </PageShell>
  )
}
