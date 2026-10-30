import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TimePickerField } from '@/components/ui/time-picker-field';
import { useMyAssignments } from '@/hooks/useMyAssignments';
import { formatMinutes, nowTimeString, todayString } from '@/lib/time';
import { createWorkEntry } from '@/services/work-entries.service';
import { WORK_ENTRY_CATEGORIES, WORK_ENTRY_STATUSES } from '@/types/work-entry';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  FileText,
  StickyNote,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Field, Section } from '../admin/assignments/form-layout';

const schema = z.object({
  assignmentId: z.string().min(1, 'Assignment is required'),
  entryDate: z.string().min(1, 'Date is required'),
  entryTime: z.string().min(1, 'Time is required'),
  taskCategory: z.enum(
    [
      'Administrative',
      'Clinical Coordination',
      'Data Entry',
      'Communication',
      'Research',
      'Scheduling',
      'Other',
    ],
    { error: 'Category is required' }
  ),
  taskDescription: z.string().min(1, 'Description is required'),
  timeSpent: z
    .number({ error: 'Duration is required' })
    .int('Enter whole minutes')
    .min(1, 'Enter at least 1 minute')
    .max(480, 'Maximum is 480 minutes (8 hours) per entry'),
  status: z.enum(['completed', 'in_progress', 'pending']),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// Status colour is a small dot only, like the pills elsewhere in the CRM.
const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  completed: { label: 'Completed', dot: 'bg-status-success' },
  in_progress: { label: 'In Progress', dot: 'bg-status-info' },
  pending: { label: 'Pending', dot: 'bg-status-warning' },
};

// Shortcuts that fill the duration field; any value can still be typed.
const DURATION_PRESETS = [15, 30, 60, 120];

export default function AddWorkEntryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    assignments,
    isLoading: loadingAssignments,
    isError: assignmentsError,
  } = useMyAssignments();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      entryDate: todayString(),
      entryTime: nowTimeString(),
      status: 'completed',
    },
  });

  const timeSpent = useWatch({ control, name: 'timeSpent' });

  useEffect(() => {
    if (assignments.length === 1 && assignments[0]) {
      setValue('assignmentId', assignments[0]._id);
    }
  }, [assignments, setValue]);

  async function onSubmit(data: FormData) {
    setSubmitError(null);
    try {
      await createWorkEntry(data);
      queryClient.invalidateQueries({ queryKey: ['work-entries'] });
      toast.success('Work entry saved.');
      navigate('/va/work/history');
    } catch {
      setSubmitError('Failed to save work entry. Please try again.');
      toast.error('Failed to save work entry. Please try again.');
    }
  }

  if (loadingAssignments) return <PageSkeleton />;

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

  const durationValid =
    typeof timeSpent === 'number' && Number.isFinite(timeSpent) && timeSpent > 0;

  return (
    <PageShell>
      <PageHeader />

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="rounded-lg border border-border bg-card"
      >
        <div className="space-y-5 p-6">
          {submitError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {/* ── Assignment ── */}
          <Section icon={<Briefcase size={14} />} title="Assignment">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Assigned role" error={errors.assignmentId?.message}>
                <Controller
                  control={control}
                  name="assignmentId"
                  render={({ field }) => {
                    // A lone assignment is passed straight in: setting it after mount races
                    // the Select registering its options, which resets the field to "".
                    const only = assignments.length === 1 ? assignments[0]! : null;
                    if (only) {
                      return (
                        <div className="flex h-10 min-w-0 flex-col justify-center rounded-md border border-border bg-white/[0.03] px-3">
                          <span className="truncate text-sm leading-tight">
                            {only.serviceType ?? only._id}
                          </span>
                          {only.companyName && (
                            <span className="truncate text-xs leading-tight text-muted-foreground">
                              {only.companyName}
                            </span>
                          )}
                        </div>
                      );
                    }
                    return (
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
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
                    );
                  }}
                />
              </Field>

              <Field label="Category" error={errors.taskCategory?.message}>
                <Controller
                  control={control}
                  name="taskCategory"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
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
            </div>
          </Section>

          {/* ── When and how long ── */}
          <Section icon={<CalendarDays size={14} />} title="When and how long">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Date" error={errors.entryDate?.message}>
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
              </Field>
              <Field label="Start time" error={errors.entryTime?.message}>
                <Controller
                  name="entryTime"
                  control={control}
                  render={({ field }) => (
                    <TimePickerField
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
              <Field label="Duration" error={errors.timeSpent?.message}>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    placeholder="60"
                    className="pr-12"
                    {...register('timeSpent', { valueAsNumber: true })}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                    min
                  </span>
                </div>
              </Field>
            </div>

            {/* Quick durations, and the typed value read back as hours. */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-muted-foreground">Quick:</span>
              {DURATION_PRESETS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    setValue('timeSpent', m, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className={`h-7 rounded-md border px-2.5 text-xs transition-colors ${
                    timeSpent === m
                      ? 'border-border-strong bg-white/[0.08] text-foreground'
                      : 'border-border text-muted-foreground hover:border-input hover:text-foreground'
                  }`}
                >
                  {formatMinutes(m)}
                </button>
              ))}
              {durationValid && (
                <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                  = {formatMinutes(timeSpent)}
                </span>
              )}
            </div>
          </Section>

          {/* ── Task ── */}
          <Section icon={<FileText size={14} />} title="Task">
            <Field
              label="Description"
              error={errors.taskDescription?.message}
              hint="Be specific — what did you do?"
            >
              <Textarea
                placeholder="e.g. Updated 12 patient records in Epic, responded to 8 emails…"
                className="resize-none"
                rows={3}
                {...register('taskDescription')}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status" error={errors.status?.message}>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORK_ENTRY_STATUSES.map(s => (
                          <SelectItem key={s} value={s}>
                            <span className="flex items-center gap-2">
                              <span
                                className={`size-1.5 rounded-full ${STATUS_CONFIG[s]?.dot ?? 'bg-text-tertiary'}`}
                              />
                              {STATUS_CONFIG[s]?.label ?? s}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
          </Section>

          {/* ── Notes (optional) ── */}
          <Section icon={<StickyNote size={14} />} title="Notes" optional>
            <Field label="" error={errors.notes?.message}>
              <Textarea
                placeholder="Any additional context, links, or follow-up notes…"
                className="resize-none"
                rows={2}
                {...register('notes')}
              />
            </Field>
          </Section>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-text-inverse/30 border-t-text-inverse" />
                Saving…
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                Save work entry
              </>
            )}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}

// ─── Layout pieces ─────────────────────────────────────────────

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="max-w-3xl">{children}</div>
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-foreground">Log Work Entry</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Record a task you completed or are working on
      </p>
    </div>
  );
}

function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center">
      {children}
    </div>
  );
}

function PageSkeleton() {
  return (
    <PageShell>
      <div className="mb-6 space-y-2">
        <div className="h-7 w-44 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </PageShell>
  );
}
