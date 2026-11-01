import {
  AlertCircle,
  Briefcase,
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
import { Field, Section } from '@/components/shared/form-layout';
import {
  AssignmentSelect,
  FormActions,
  FormMessageCard,
  FormPage,
  FormPageSkeleton,
} from './form-page';
import { DEFAULT_WORK_ENTRY } from './eod-submit/schema';
import { ShiftSection } from './eod-submit/ShiftSection';
import { useEodSubmitForm } from './eod-submit/use-eod-submit-form';
import { WorkEntryCard } from './eod-submit/WorkEntryCard';

export default function EodSubmitPage() {
  const navigate = useNavigate();
  const f = useEodSubmitForm();
  const { control, register, setValue, errors, assignments } = f;

  const title = 'End of Day Report';
  const description =
    'Submit your daily work summary to keep your team updated';

  if (f.loading) return <FormPageSkeleton rows={4} />;

  if (f.assignmentsError) {
    return (
      <FormPage title={title} description={description}>
        <FormMessageCard tone="error">
          Failed to load assignments. Please refresh the page.
        </FormMessageCard>
      </FormPage>
    );
  }

  if (assignments.length === 0) {
    return (
      <FormPage title={title} description={description}>
        <FormMessageCard>
          No active assignments found. Contact your account manager.
        </FormMessageCard>
      </FormPage>
    );
  }

  if (f.alreadySubmitted) {
    return (
      <FormPage title={title} description={description}>
        <AlreadySubmittedCard
          dateLabel="today"
          onViewHistory={() => navigate('/va/eod/history')}
        />
      </FormPage>
    );
  }

  // Pending tasks and blockers are required; "None" is the usual answer.
  const fillNone = (name: 'pendingTasks' | 'blockers') =>
    setValue(name, 'None', { shouldDirty: true, shouldValidate: true });

  return (
    <FormPage title={title} description={description}>
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
              <AssignmentSelect
                control={control}
                assignments={assignments}
                narrow
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

        <FormActions
          submitting={f.isSubmitting}
          submitLabel="Submit EOD report"
          submittingLabel="Submitting…"
          onCancel={() => navigate(-1)}
        />
      </form>
    </FormPage>
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
