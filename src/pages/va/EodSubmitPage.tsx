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
  assignment_id:    z.string().min(1, 'Assignment is required'),
  date:             z.string().min(1, 'Date is required'),
  shift_start:      z.string().min(1, 'Shift start is required'),
  shift_end:        z.string().min(1, 'Shift end is required'),
  summary_of_work:  z.string().min(10, 'Please provide a summary (min 10 characters)'),
  pending_tasks:    z.string().min(1, 'List pending tasks or write "None"'),
  blockers:         z.string().min(1, 'Describe blockers or write "None"'),
  notes:            z.string().optional(),
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
    defaultValues: { date: today, shift_start: '09:00', shift_end: '17:00' },
  })

  const shiftStart = watch('shift_start') ?? ''
  const shiftEnd   = watch('shift_end') ?? ''
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
      setValue('assignment_id', assignments[0].id)
    }
  }, [assignments, setValue])

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      await createEodSubmission({ ...data, hours_worked: hoursWorked })
      navigate('/va/eod/history')
    } catch {
      setError('Failed to submit EOD. Please try again.')
    }
  }

  if (loadingAssignments || checkingEod) return <PageSkeleton />

  if (assignments.length === 0) {
    return (
      <div className="max-w-2xl">
        <PageHeader />
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <p className="text-sm text-[#64748B]">No active assignments found. Contact your account manager.</p>
        </div>
      </div>
    )
  }

  if (alreadySubmitted) {
    return (
      <div className="max-w-2xl">
        <PageHeader />
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-3">
          <CheckCircle2 size={36} className="text-green-500 mx-auto" />
          <p className="text-base font-medium text-[#0F172A]">EOD already submitted for today</p>
          <p className="text-sm text-[#64748B]">You can view it in your EOD history.</p>
          <button
            onClick={() => navigate('/va/eod/history')}
            className="text-sm text-[#7B6CF6] hover:underline"
          >
            View EOD History →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <PageHeader />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Assignment */}
          <Field label="Assignment" error={errors.assignment_id?.message}>
            <Controller
              control={control}
              name="assignment_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={assignments.length === 1}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.service_type ?? a.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Date */}
          <Field label="Date" error={errors.date?.message}>
            <Input type="date" className="rounded-xl border-slate-200 max-w-[200px]" {...register('date')} />
          </Field>

          {/* Shift times + hours */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Shift Start" error={errors.shift_start?.message}>
              <Input type="time" className="rounded-xl border-slate-200" {...register('shift_start')} />
            </Field>
            <Field label="Shift End" error={errors.shift_end?.message}>
              <Input type="time" className="rounded-xl border-slate-200" {...register('shift_end')} />
            </Field>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#0F172A]">Hours Worked</Label>
              <div className="h-10 flex items-center px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-[#64748B]">
                {hoursWorked}h
              </div>
            </div>
          </div>

          {/* Summary */}
          <Field label="Summary of Work" error={errors.summary_of_work?.message}>
            <Textarea
              placeholder="What did you accomplish today?"
              className="rounded-xl border-slate-200 resize-none"
              rows={4}
              {...register('summary_of_work')}
            />
          </Field>

          {/* Pending tasks */}
          <Field label="Pending Tasks" error={errors.pending_tasks?.message}>
            <Textarea
              placeholder="List pending tasks or write 'None'"
              className="rounded-xl border-slate-200 resize-none"
              rows={3}
              {...register('pending_tasks')}
            />
          </Field>

          {/* Blockers */}
          <Field label="Blockers" error={errors.blockers?.message}>
            <Textarea
              placeholder="Describe blockers or write 'None'"
              className="rounded-xl border-slate-200 resize-none"
              rows={2}
              {...register('blockers')}
            />
          </Field>

          {/* Notes */}
          <Field label="Notes (optional)" error={errors.notes?.message}>
            <Textarea
              placeholder="Any additional notes…"
              className="rounded-xl border-slate-200 resize-none"
              rows={2}
              {...register('notes')}
            />
          </Field>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#7B6CF6] to-[#5AC8FA] hover:opacity-90 text-white rounded-xl h-10 font-medium transition-opacity"
          >
            {isSubmitting ? 'Submitting…' : 'Submit EOD'}
          </Button>

        </form>
      </div>
    </div>
  )
}

// ─── Micro-components ─────────────────────────────────────────

function PageHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-[#0F172A]">End of Day Report</h1>
      <p className="text-sm text-[#64748B] mt-0.5">Submit your daily work summary</p>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[#0F172A]">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="h-8 w-48 rounded-xl bg-slate-100 animate-pulse" />
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
