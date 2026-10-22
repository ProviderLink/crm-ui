import { useEodSubmissionQuery } from '@/hooks/queries';
import { getApiError } from '@/lib/api-error';
import { formatMinutes } from '@/lib/time';
import type {
  CommunicatedWithClient,
  EodWorkStatus,
  IEodSubmission,
  IEodWorkEntry,
} from '@/types/eod-submission';
import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const STATUS_LABELS: Record<EodWorkStatus, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending Client Input',
};

const Q2_LABELS: Record<CommunicatedWithClient, string> = {
  yes: 'Yes',
  no: 'No',
  other: 'Other',
};

interface EodDetailSheetProps {
  eodId: string | null;
  onOpenChange: (open: boolean) => void;
  /**
   * Optional fallback record from the listing table. Used only to render
   * header context instantly while the by-id query loads; the body always
   * reflects the by-id response so server-side authorization is honored.
   */
  fallback?: IEodSubmission | null;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="text-sm text-foreground whitespace-pre-wrap break-words">
        {children}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function formatDate(raw?: string): string {
  if (!raw) return '—';
  return raw.slice(0, 10);
}

function formatTimestamp(raw?: string): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString();
}

function WorkEntryCard({
  entry,
  index,
}: {
  entry: IEodWorkEntry;
  index: number;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Work {index + 1}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider rounded px-1.5 py-0.5 bg-white/[0.04] text-text-secondary ring-1 ring-[rgba(255,255,255,0.08)]">
          {STATUS_LABELS[entry.status] ?? entry.status}
        </span>
      </div>
      <Field label="Task">{entry.task || '—'}</Field>
      <Field label="Description">{entry.description || '—'}</Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity">{entry.quantity}</Field>
        <Field label="Time Spent">{formatMinutes(entry.timeSpent)}</Field>
      </div>
    </div>
  );
}

export function EodDetailSheet({
  eodId,
  onOpenChange,
  fallback,
}: EodDetailSheetProps) {
  const { data, isLoading, isError, error } = useEodSubmissionQuery(
    eodId ?? undefined
  );

  const eod: IEodSubmission | undefined = data ?? fallback ?? undefined;

  return (
    <Sheet open={eodId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>EOD Submission</SheetTitle>
          <SheetDescription>
            {eod ? formatDate(eod.date) : 'Loading…'}
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
            Loading EOD details…
          </div>
        )}

        {isError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {getApiError(
              error,
              'Failed to load EOD details. You may not have permission to view this submission.'
            )}
          </div>
        )}

        {!isLoading && !isError && eod && (
          <div className="mt-4 space-y-4">
            <Section title="People">
              <Field label="VA">{eod.candidateName || eod.candidateId}</Field>
              <Field label="Client">{eod.companyName || eod.clientId}</Field>
            </Section>

            <Section title="Shift">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Date">{formatDate(eod.date)}</Field>
                <Field label="Start">{eod.shiftStart || '—'}</Field>
                <Field label="End">{eod.shiftEnd || '—'}</Field>
              </div>
              <Field label="Hours Worked">{eod.hoursWorked}h</Field>
            </Section>

            <Section title="Summary of Work">
              {eod.workEntries && eod.workEntries.length > 0 ? (
                <div className="space-y-3">
                  {eod.workEntries.map((entry, idx) => (
                    <WorkEntryCard key={idx} entry={entry} index={idx} />
                  ))}
                </div>
              ) : (
                <Field label="Tasks Completed">
                  {eod.summaryOfWork || '—'}
                </Field>
              )}
            </Section>

            <Section title="Pending Tasks">
              <Field label="Pending / In Progress">
                {eod.pendingTasks || '—'}
              </Field>
            </Section>

            <Section title="Blockers">
              <Field label="Anything preventing progress">
                {eod.blockers || '—'}
              </Field>
            </Section>

            <Section title="Client Communication">
              <Field label="Did you communicate with the client today?">
                {eod.communicatedWithClient
                  ? (Q2_LABELS[eod.communicatedWithClient] ??
                    eod.communicatedWithClient)
                  : '—'}
              </Field>
              <Field label="Additional notes for the client">
                {eod.clientNote || '—'}
              </Field>
            </Section>

            {eod.notes && (
              <Section title="Additional Notes">
                <Field label="VA Notes">{eod.notes}</Field>
              </Section>
            )}

            <Section title="Submission">
              <Field label="Submitted At">
                {formatTimestamp(eod.createdAt)}
              </Field>
            </Section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
