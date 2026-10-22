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
import { useMyAssignments } from '@/hooks/useMyAssignments';
import { nowTimeString, todayString } from '@/lib/time';
import { createWorkEntry } from '@/services/work-entries.service';
import { WORK_ENTRY_CATEGORIES, WORK_ENTRY_STATUSES } from '@/types/work-entry';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlarmClock,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  StickyNote,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  assignmentId: z.string().min(1, 'Assignment is required'),
  entryDate: z.string().min(1, 'Date is required'),
  entryTime: z.string().min(1, 'Time is required'),
  taskCategory: z.enum([
    'Administrative',
    'Clinical Coordination',
    'Data Entry',
    'Communication',
    'Research',
    'Scheduling',
    'Other',
  ]),
  taskDescription: z.string().min(1, 'Description is required'),
  timeSpent: z
    .number()
    .int()
    .min(1, 'Enter at least 1 minute')
    .max(480, 'Maximum is 480 minutes (8 hours) per entry'),
  status: z.enum(['completed', 'in_progress', 'pending']),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completed', color: 'text-text-secondary' },
  in_progress: { label: 'In Progress', color: 'text-text-secondary' },
  pending: { label: 'Pending', color: 'text-text-tertiary' },
};

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

  return (
    <PageShell>
      <PageHeader />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {submitError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {submitError}
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

        {/* ── Section: When ── */}
        <Section icon={<CalendarDays size={14} />} title="When">
          <div className="grid grid-cols-2 gap-4">
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
            <Field label="Start Time" error={errors.entryTime?.message}>
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
          </div>
        </Section>

        {/* ── Section: Task Details ── */}
        <Section icon={<FileText size={14} />} title="Task Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" error={errors.taskCategory?.message}>
              <Controller
                control={control}
                name="taskCategory"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl border-input h-10">
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
            <Field label="Status" error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl border-input h-10">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_ENTRY_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>
                          <span className={STATUS_CONFIG[s]?.color}>
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

          <Field
            label="Description"
            error={errors.taskDescription?.message}
            hint="Be specific — what did you do?"
          >
            <Textarea
              placeholder="e.g. Updated 12 patient records in Epic, responded to 8 emails…"
              className="rounded-xl border-input resize-none"
              rows={3}
              {...register('taskDescription')}
            />
          </Field>
        </Section>

        {/* ── Section: Time ── */}
        <Section icon={<Clock size={14} />} title="Time Spent">
          <Field
            label="Duration (minutes)"
            error={errors.timeSpent?.message}
            hint="Total minutes spent on this task"
          >
            <div className="relative max-w-[180px]">
              <Input
                type="number"
                min={1}
                placeholder="60"
                className="rounded-xl border-input h-10 pr-14"
                {...register('timeSpent', { valueAsNumber: true })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                min
              </span>
            </div>
          </Field>
        </Section>

        {/* ── Section: Notes (optional) ── */}
        <Section icon={<StickyNote size={14} />} title="Notes" optional>
          <Field label="" error={errors.notes?.message}>
            <Textarea
              placeholder="Any additional context, links, or follow-up notes…"
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
                Saving…
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                Save Work Entry
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
        <AlarmClock size={18} className="text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">
          Log Work Entry
        </h1>
      </div>
      <p className="text-sm text-muted-foreground ml-7">
        Record a task you completed or are working on
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
        <p className="text-[11px] text-muted-foreground -mt-0.5">{hint}</p>
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
        <div className="h-6 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded-lg bg-muted animate-pulse" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card rounded-2xl border border-border mb-4">
          <div className="h-10 border-b border-border bg-muted/30 rounded-t-2xl animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-10 rounded-xl bg-muted animate-pulse" />
            <div className="h-10 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </PageShell>
  );
}
