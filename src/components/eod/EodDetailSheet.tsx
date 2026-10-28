import { AlertCircle, ClockIcon, XIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { useEodSubmissionQuery } from '@/hooks/queries';
import { getApiError } from '@/lib/api-error';
import { WORK_ENTRY_STATUS_STYLES } from '@/lib/status-styles';
import { formatMinutes } from '@/lib/time';
import type {
  CommunicatedWithClient,
  EodWorkStatus,
  IEodSubmission,
} from '@/types/eod-submission';

const STATUS_LABELS: Record<EodWorkStatus, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending Client Input',
};

const COMMUNICATED_STYLES: Record<CommunicatedWithClient, string> = {
  yes: 'bg-white/[0.04] text-status-success border-status-success/20',
  no: 'bg-white/[0.04] text-text-secondary border-white/[0.08]',
  other: 'bg-white/[0.04] text-status-info border-status-info/20',
};

const COMMUNICATED_LABELS: Record<CommunicatedWithClient, string> = {
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

/** "Tuesday, Oct 27, 2026", built from the key's parts to avoid timezone drift. */
function formatDay(raw?: string): string {
  const [y, m, d] = (raw ?? '').slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return raw ?? '—';
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatSubmitted(raw?: string): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Free text from the VA; empty values read as a quiet "None". */
function TextBlock({ value, empty }: { value?: string | null; empty: string }) {
  return value?.trim() ? (
    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
      {value}
    </p>
  ) : (
    <p className="text-sm text-muted-foreground/60">{empty}</p>
  );
}

function WorkList({ eod }: { eod: IEodSubmission }) {
  const entries = eod.workEntries ?? [];

  // Older reports only have a free-text summary.
  if (entries.length === 0) {
    return <TextBlock value={eod.summaryOfWork} empty="No work recorded." />;
  }

  const totalMinutes = entries.reduce((sum, e) => sum + (e.timeSpent || 0), 0);
  return (
    <div className="rounded-lg border border-white/[0.1] bg-white/[0.03]">
      <ul className="divide-y divide-white/[0.08]">
        {entries.map((e, i) => (
          <li key={i} className="flex items-start justify-between gap-4 p-3.5">
            <div className="min-w-0">
              <p className="flex items-baseline gap-2 text-sm font-medium text-foreground">
                <span className="break-words">{e.task || '—'}</span>
                {e.quantity ? (
                  <span className="shrink-0 text-xs font-normal tabular-nums text-muted-foreground">
                    ×{e.quantity}
                  </span>
                ) : null}
              </p>
              {e.description && (
                <p className="mt-1 text-sm leading-relaxed break-words text-muted-foreground">
                  {e.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${WORK_ENTRY_STATUS_STYLES[e.status]}`}
              >
                {STATUS_LABELS[e.status] ?? e.status}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatMinutes(e.timeSpent)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-white/[0.08] px-3.5 py-2 text-xs text-muted-foreground">
        <span>Total time logged</span>
        <span className="font-medium tabular-nums text-foreground">
          {formatMinutes(totalMinutes)}
        </span>
      </div>
    </div>
  );
}

function EodBody({ eod }: { eod: IEodSubmission }) {
  const entries = eod.workEntries ?? [];
  const done = entries.filter(e => e.status === 'completed').length;
  const hasBlockers = !!eod.blockers?.trim();

  return (
    <div className="space-y-6">
      <div
        className={`grid gap-3 ${entries.length > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}
      >
        <Stat
          label="Shift"
          value={`${eod.shiftStart || '—'} – ${eod.shiftEnd || '—'}`}
        />
        <Stat label="Hours worked" value={`${eod.hoursWorked}h`} />
        {entries.length > 0 && (
          <Stat label="Tasks done" value={`${done} of ${entries.length}`} />
        )}
      </div>

      <Section
        title="Work done"
        aside={
          entries.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              {entries.length} {entries.length === 1 ? 'task' : 'tasks'}
            </span>
          ) : undefined
        }
      >
        <WorkList eod={eod} />
      </Section>

      <div className="grid gap-6 sm:grid-cols-2">
        <Section
          title="Still pending"
        >
          <TextBlock value={eod.pendingTasks} empty="Nothing pending." />
        </Section>

        <Section
            title="Blockers"
        >
          {hasBlockers ? (
            <p className="rounded-lg border border-status-warning/20 bg-status-warning/5 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
              {eod.blockers}
            </p>
          ) : (
            <TextBlock value={null} empty="No blockers." />
          )}
        </Section>
      </div>

      <Section
        title="Client communication"
        aside={
          eod.communicatedWithClient ? (
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${COMMUNICATED_STYLES[eod.communicatedWithClient]}`}
            >
              {COMMUNICATED_LABELS[eod.communicatedWithClient] ??
                eod.communicatedWithClient}
            </span>
          ) : undefined
        }
      >
        <div className="border-l-2 border-border pl-3">
          <TextBlock
            value={eod.clientNote}
            empty="No note was left for the client."
          />
        </div>
      </Section>

      {eod.notes?.trim() && (
        <Section title="VA notes">
          <TextBlock value={eod.notes} empty="" />
        </Section>
      )}
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
  const vaName = eod ? eod.candidateName || eod.candidateId : '';

  return (
    <Sheet open={eodId !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        // Floats with a gap to the viewport; the built-in close button is
        // hidden in favour of the one below, outside the drawer's top-left.
        className="flex w-[calc(100vw-2rem)] flex-col gap-0 overflow-visible border-white/[0.14] bg-surface-raised p-0 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9)] sm:max-w-xl [&>button:last-child]:hidden"
      >
        <SheetClose asChild>
          <Button
            size="icon"
            variant="outline"
            aria-label="Close"
            className="absolute right-3 top-3 z-10 size-8 rounded-md border-white/[0.14] bg-surface-raised min-[700px]:-left-11 min-[700px]:right-auto min-[700px]:top-0"
          >
            <XIcon className="size-4" />
          </Button>
        </SheetClose>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
          <header className="flex items-center gap-3 border-b border-border px-6 py-4 pr-14 min-[700px]:pr-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-sm font-medium text-text-secondary">
              {vaName ? initialsOf(vaName) || '?' : '…'}
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate text-xl">
                {vaName || 'EOD report'}
              </SheetTitle>
              <SheetDescription className="mt-0.5 truncate">
                {eod
                  ? `${eod.companyName || eod.clientId} · ${formatDay(eod.date)}`
                  : 'Loading…'}
              </SheetDescription>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                Loading EOD details…
              </div>
            )}

            {isError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                {getApiError(
                  error,
                  'Failed to load EOD details. You may not have permission to view this submission.'
                )}
              </div>
            )}

            {!isLoading && !isError && eod && <EodBody eod={eod} />}
          </div>

          {!isLoading && !isError && eod && (
            <div className="flex items-center gap-2 border-t border-border px-6 py-3 text-xs text-muted-foreground">
              <ClockIcon className="size-3.5" />
              Submitted {formatSubmitted(eod.createdAt)}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
