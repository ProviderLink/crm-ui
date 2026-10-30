import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  MessageSquareIcon,
  PlusIcon,
  StickyNote,
} from 'lucide-react';
import { Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  COMMUNICATED_WITH_CLIENT_LABELS,
  COMMUNICATED_WITH_CLIENT_OPTIONS,
} from '@/types/eod-submission';

import { AlreadySubmittedCard } from './eod-submit/AlreadySubmittedCard';
import {
  EmptyCard,
  Field,
  PageHeader,
  PageShell,
  PageSkeleton,
  Section,
} from './eod-submit/layout';
import { DEFAULT_WORK_ENTRY } from './eod-submit/schema';
import { ShiftSection } from './eod-submit/ShiftSection';
import { useEodSubmitForm } from './eod-submit/use-eod-submit-form';
import { WorkEntryCard } from './eod-submit/WorkEntryCard';

export default function EodSubmitPage() {
  const navigate = useNavigate();
  const f = useEodSubmitForm();
  const { control, register, setValue, errors, assignments } = f;

  if (f.loading) return <PageSkeleton />;

  if (f.assignmentsError) {
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

  if (f.alreadySubmitted) {
    return (
      <PageShell>
        <PageHeader />
        <AlreadySubmittedCard
          dateLabel="today"
          onViewHistory={() => navigate('/va/eod/history')}
        />
      </PageShell>
    );
  }

  // Pending tasks and blockers are required; "None" is the usual answer.
  const fillNone = (name: 'pendingTasks' | 'blockers') =>
    setValue(name, 'None', { shouldDirty: true, shouldValidate: true });

  return (
    <PageShell>
      <PageHeader />

      <form
        onSubmit={f.onFormSubmit}
        noValidate
        className="rounded-lg border border-border bg-card"
      >
        <div className="space-y-5 p-6">
          {f.error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {f.error}
            </div>
          )}

          {/* ── Assignment ── */}
          <Section icon={<Briefcase size={14} />} title="Assignment">
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
                      <div className="flex h-10 min-w-0 flex-col justify-center rounded-md border border-border bg-white/[0.03] px-3 sm:max-w-[calc(50%-0.5rem)]">
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
          </Section>

          <ShiftSection
            control={control}
            errors={errors}
            today={f.today}
            companyTimezone={f.companyTimezone}
            hoursWorked={f.hoursWorked}
          />

          {/* ── Work completed ── */}
          <Section icon={<ClipboardList size={14} />} title="Work completed">
            {errors.workEntries?.message && (
              <p className="text-xs text-destructive">
                {errors.workEntries.message}
              </p>
            )}

            <div className="divide-y divide-white/[0.08] rounded-lg border border-white/[0.1] bg-white/[0.03]">
              {f.workFields.map((field, idx) => (
                <WorkEntryCard
                  key={field.id}
                  idx={idx}
                  canRemove={f.workFields.length > 1}
                  onRemove={() => f.removeWork(idx)}
                  control={control}
                  register={register}
                  setValue={setValue}
                  errors={errors}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => f.appendWork({ ...DEFAULT_WORK_ENTRY })}
            >
              <PlusIcon className="size-4" />
              Add work
            </Button>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Pending tasks"
                error={errors.pendingTasks?.message}
                hint='Tasks carrying over to tomorrow. Write "None" if everything is resolved.'
              >
                <Textarea
                  placeholder="e.g. Follow up on 2 insurance pre-auth requests. Or: None"
                  className="resize-none"
                  rows={3}
                  {...register('pendingTasks')}
                />
                <NoneShortcut onClick={() => fillNone('pendingTasks')} />
              </Field>

              <Field
                label="Blockers"
                error={errors.blockers?.message}
                hint='Anything preventing you from moving forward? Write "None" if clear.'
              >
                <Textarea
                  placeholder="e.g. Waiting on client response for appointment confirmation. Or: None"
                  className="resize-none"
                  rows={3}
                  {...register('blockers')}
                />
                <NoneShortcut onClick={() => fillNone('blockers')} />
              </Field>
            </div>
          </Section>

          {/* ── Client communication ── */}
          <Section
            icon={<MessageSquareIcon size={14} />}
            title="Client communication"
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
                    <SelectTrigger className="sm:max-w-[calc(50%-0.5rem)]">
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
                className="resize-none"
                rows={3}
                {...register('clientNote')}
              />
            </Field>
          </Section>

          {/* ── Notes (optional) ── */}
          <Section icon={<StickyNote size={14} />} title="Notes" optional>
            <Field label="" error={errors.notes?.message}>
              <Textarea
                placeholder="Additional context, links, or anything else worth noting…"
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
          <Button type="submit" disabled={f.isSubmitting} className="gap-2">
            {f.isSubmitting ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-text-inverse/30 border-t-text-inverse" />
                Submitting…
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                Submit EOD report
              </>
            )}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}

/** A small link under a required free-text field that fills in "None". */
function NoneShortcut({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      Use “None”
    </button>
  );
}
