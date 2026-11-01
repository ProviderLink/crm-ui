import { Page, PageSection } from '@/components/shared/PageLayout';
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
import { QK } from '@/hooks/queries';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useMyAssignments } from '@/hooks/useMyAssignments';
import { WORK_STATUS_DOT } from '@/lib/status-styles';
import { nowTimeString, todayString } from '@/lib/time';
import { createWorkEntry } from '@/services/work-entries.service';
import {
  WORK_ENTRY_CATEGORIES,
  WORK_ENTRY_STATUS_LABELS,
  WORK_ENTRY_STATUSES,
} from '@/types/work-entry';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  FileText,
  StickyNote,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Field, Section } from '../admin/assignments/form-layout';
import { DurationPresets } from './duration-presets';
import { addWorkEntrySchema, type AddWorkEntryForm } from './work-entry-schema';

type FormData = AddWorkEntryForm;

export default function AddWorkEntryPage() {
  const navigate = useNavigate();
  const {
    assignments,
    isLoading: loadingAssignments,
    isError: assignmentsError,
  } = useMyAssignments();
  const save = useApiMutation({
    mutationFn: createWorkEntry,
    invalidate: [QK.workEntriesAll],
    successMessage: 'Work entry saved.',
    errorMessage: 'Failed to save work entry. Please try again.',
    toastError: true,
  });
  const submitError = save.error;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(addWorkEntrySchema),
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
    if (await save.run(data)) navigate('/va/work/history');
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
                    const only =
                      assignments.length === 1 ? assignments[0]! : null;
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

            <DurationPresets
              value={timeSpent}
              onPick={m =>
                setValue('timeSpent', m, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
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
                                className={`size-1.5 rounded-full ${WORK_STATUS_DOT[s]}`}
                              />
                              {WORK_ENTRY_STATUS_LABELS[s]}
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
    <Page>
      <PageSection>
        <div className="max-w-3xl">{children}</div>
      </PageSection>
    </Page>
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
