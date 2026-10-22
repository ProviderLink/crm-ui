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
  const { control, register, errors, assignments } = f;

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

  return (
    <PageShell>
      <PageHeader />

      <form onSubmit={f.onFormSubmit} noValidate className="space-y-4">
        {f.error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {f.error}
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


        <ShiftSection
          control={control}
          errors={errors}
          today={f.today}
          companyTimezone={f.companyTimezone}
          hoursWorked={f.hoursWorked}
        />

        {/* ── Section: Work Completed ── */}
        <Section icon={<ClipboardList size={14} />} title="Work Completed">
          {errors.workEntries?.message && (
            <p className="text-xs text-destructive">
              {errors.workEntries.message}
            </p>
          )}

          <div className="space-y-3">
            {f.workFields.map((field, idx) => (
              <WorkEntryCard
                key={field.id}
                idx={idx}
                canRemove={f.workFields.length > 1}
                onRemove={() => f.removeWork(idx)}
                control={control}
                register={register}
                errors={errors}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl h-10 gap-2"
            onClick={() => f.appendWork({ ...DEFAULT_WORK_ENTRY })}
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
            disabled={f.isSubmitting}
            className="flex-1 rounded-xl h-10 font-medium gap-2"
          >
            {f.isSubmitting ? (
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
