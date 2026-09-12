import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TimePickerField } from '@/components/ui/time-picker-field';
import { useEodContextQuery, useEodSubmissionsQuery } from '@/hooks/queries';
import { useMyAssignments } from '@/hooks/useMyAssignments';
import { calcHours, todayString } from '@/lib/time';
import { createEodSubmission } from '@/services/eod-submissions.service';
import {
  COMMUNICATED_WITH_CLIENT_LABELS,
  COMMUNICATED_WITH_CLIENT_OPTIONS,
  EOD_WORK_STATUSES,
  type EodWorkStatus,
} from '@/types/eod-submission';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  AlertCircle,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  MessageSquareIcon,
  PlusIcon,
  StickyNote,
  Trash2Icon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const workEntrySchema = z.object({
  task: z.string().min(1, 'Task is required'),
  description: z.string().min(1, 'Description is required'),
  quantity: z
    .number({ message: 'Quantity must be a number' })
    .min(0, 'Quantity must be 0 or more'),
  status: z.enum(['completed', 'in_progress', 'pending']),
  timeSpent: z
    .number({ message: 'Time must be a number' })
    .min(0, 'Time must be 0 or more'),
});

const schema = z.object({
  assignmentId: z.string().min(1, 'Assignment is required'),
  date: z.string().min(1, 'Date is required'),
  shiftStart: z.string().min(1, 'Shift start is required'),
  shiftEnd: z.string().min(1, 'Shift end is required'),
  workEntries: z.array(workEntrySchema).min(1, 'Add at least one work entry'),
  pendingTasks: z.string().min(1, 'List pending tasks or write "None"'),
  blockers: z.string().min(1, 'Describe blockers or write "None"'),
  communicatedWithClient: z.enum(['yes', 'no', 'other'], {
    message: 'Please indicate whether you communicated with the client today',
  }),
  clientNote: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STATUS_LABELS: Record<EodWorkStatus, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending Client Input',
};

const DEFAULT_WORK_ENTRY = {
  task: '',
  description: '',
  quantity: 0,
  status: 'completed' as EodWorkStatus,
  timeSpent: 0,
};

export default function EodSubmitPage() {
  const navigate = useNavigate();
  /**
   * VAs work from every timezone but report against the **company's** business
   * day, so "today" comes from the backend (company timezone) rather than the
   * device clock. The device value is only a placeholder until it resolves.
   */
  const deviceToday = todayString();
  const { data: eodContext, isLoading: loadingContext } = useEodContextQuery();
  const today = eodContext?.dateKey ?? deviceToday;
  const companyTimezone = eodContext?.timezone ?? null;
  const {
    assignments,
    isLoading: loadingAssignments,
    isError: assignmentsError,
  } = useMyAssignments();
  const queryClient = useQueryClient();
  const { data: eods = [], isLoading: checkingEod } = useEodSubmissionsQuery({
    date: today,
  });
  const submittedKeys = new Set(eods.map(e => `${e.assignmentId}::${e.date}`));
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      communicatedWithClient: undefined,
      date: today,
      shiftStart: '',
      shiftEnd: '',
      workEntries: [DEFAULT_WORK_ENTRY],
    },
  });

  const {
    fields: workFields,
    append: appendWork,
    remove: removeWork,
  } = useFieldArray({ control, name: 'workEntries' });

  const selectedDate = watch('date') ?? today;
  const selectedAssignmentId = watch('assignmentId') ?? '';
  const shiftStart = watch('shiftStart') ?? '';
  const shiftEnd = watch('shiftEnd') ?? '';
  // Preview only — the server recomputes this from the shift times.
  const hoursWorked = calcHours(shiftStart, shiftEnd);
  const alreadySubmitted = selectedAssignmentId
    ? submittedKeys.has(`${selectedAssignmentId}::${selectedDate}`)
    : false;

  // Correct the placeholder date once the company business day is known, but
  // only while the VA has not picked a date themselves.
  useEffect(() => {
    if (!eodContext) return;
    const current = getValues('date');
    if (!current || current === deviceToday) {
      setValue('date', eodContext.dateKey, { shouldValidate: true });
    }
  }, [eodContext, deviceToday, getValues, setValue]);

  useEffect(() => {
    if (assignments.length === 1 && assignments[0]) {
      setValue('assignmentId', assignments[0]._id);
    }
  }, [assignments, setValue]);

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      // `date` is sent as the company business day; `hoursWorked` is derived
      // server-side so overnight shifts are not under-counted.
      await createEodSubmission(data);
      queryClient.invalidateQueries({ queryKey: ['eod-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['eod-context'] });
      navigate('/va/eod/history');
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error?.message ??
          'Failed to submit EOD. Please try again.')
        : 'Failed to submit EOD. Please try again.';
      setError(msg);
    }
  }

  if (loadingAssignments || checkingEod || loadingContext)
    return <PageSkeleton />;

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
    );
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
    );
  }

  if (alreadySubmitted) {
    return (
      <PageShell>
        <PageHeader />
        <div className="bg-card rounded-lg border border-border p-10 flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 rounded-full bg-white/[0.04] border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
            <CheckCircle2 size={28} className="text-[#A0A0A0]" />
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
            className="text-sm text-[#A0A0A0] hover:text-white underline-offset-4"
          >
            View EOD History →
          </button>
        </div>
      </PageShell>
    );
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
                      <SelectItem key={a._id} value={a._id}>
                        <span className="flex flex-col">
                          <span>{a.serviceType ?? a._id}</span>
                          {a.companyName && (
                            <span className="text-xs text-muted-foreground">
                              {a.companyName}
                            </span>
                          )}
                        </span>
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
            <Field
              label="Date"
              error={errors.date?.message}
              hint={
                companyTimezone
                  ? `Your report is filed against the company's business day (${companyTimezone}), which may differ from your local date. Late submissions for an earlier day are still accepted.`
                  : undefined
              }
            >
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    toDate={new Date(`${today}T23:59:59`)}
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

        {/* ── Section: Work Completed ── */}
        <Section icon={<ClipboardList size={14} />} title="Work Completed">
          {errors.workEntries?.message && (
            <p className="text-xs text-destructive">
              {errors.workEntries.message}
            </p>
          )}

          <div className="space-y-3">
            {workFields.map((field, idx) => (
              <div
                key={field.id}
                className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Work {idx + 1}
                  </span>
                  {workFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeWork(idx)}
                      title="Remove this work entry"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  )}
                </div>

                <Field
                  label="Task / Work"
                  error={errors.workEntries?.[idx]?.task?.message}
                >
                  <Input
                    placeholder="e.g. Patient calls"
                    className="rounded-xl border-input h-10"
                    {...register(`workEntries.${idx}.task`)}
                  />
                </Field>

                <Field
                  label="Description"
                  error={errors.workEntries?.[idx]?.description?.message}
                >
                  <Textarea
                    placeholder="Brief description of what was done"
                    className="rounded-xl border-input resize-none"
                    rows={2}
                    {...register(`workEntries.${idx}.description`)}
                  />
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <Field
                    label="Quantity"
                    error={errors.workEntries?.[idx]?.quantity?.message}
                  >
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      className="rounded-xl border-input h-10"
                      {...register(`workEntries.${idx}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                  </Field>

                  <Field
                    label="Status"
                    error={errors.workEntries?.[idx]?.status?.message}
                  >
                    <Controller
                      control={control}
                      name={`workEntries.${idx}.status`}
                      render={({ field: statusField }) => (
                        <Select
                          value={statusField.value}
                          onValueChange={statusField.onChange}
                        >
                          <SelectTrigger className="rounded-xl border-input h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EOD_WORK_STATUSES.map(s => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  <Field
                    label="Time Spent (min)"
                    error={errors.workEntries?.[idx]?.timeSpent?.message}
                  >
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      className="rounded-xl border-input h-10"
                      {...register(`workEntries.${idx}.timeSpent`, {
                        valueAsNumber: true,
                      })}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl h-10 gap-2"
            onClick={() => appendWork({ ...DEFAULT_WORK_ENTRY })}
          >
            <PlusIcon className="size-4" />
            Add Work
          </Button>

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

        {/* ── Section: Client Communication ── */}
        <Section
          icon={<MessageSquareIcon size={14} />}
          title="Client Communication"
        >
          <Field
            label="Did you communicate with the client today?"
            error={errors.communicatedWithClient?.message}
          >
            <Controller
              control={control}
              name="communicatedWithClient"
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="rounded-xl border-input h-10">
                    <SelectValue placeholder="Select an answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMUNICATED_WITH_CLIENT_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>
                        {COMMUNICATED_WITH_CLIENT_LABELS[opt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field
            label="Additional notes or updates for the client"
            error={errors.clientNote?.message}
            hint="Optional — visible to the client in the EOD export."
          >
            <Textarea
              placeholder="Any updates the client should know about today…"
              className="rounded-xl border-input resize-none"
              rows={3}
              {...register('clientNote')}
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
  );
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
  );
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
  );
}

function Section({
  icon,
  title,
  optional = false,
  children,
}: {
  icon: ReactNode;
  title: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
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
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
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
  );
}

function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card rounded-lg border border-border p-8 text-center">
      {children}
    </div>
  );
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
  );
}
