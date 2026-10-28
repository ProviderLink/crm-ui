import { ClockIcon, XIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatMinutes } from '@/lib/time';
import type { IWorkEntry } from '@/types/work-entry';

import { initialsOf, shortDate } from './format';
import { StatusPill } from './StatusPill';

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t border-border pt-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function formatLogged(raw?: string) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** One work entry in a floating drawer; the row already carries every field. */
export function WorkEntryDrawer({
  entry,
  vaName,
  clientName,
  service,
  onClose,
}: {
  entry: IWorkEntry | null;
  vaName: string;
  clientName: string;
  service?: string;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!entry} onOpenChange={o => !o && onClose()}>
      <SheetContent
        side="right"
        // Floats with a gap to the viewport; the built-in close button is
        // hidden in favour of the one below, outside the drawer's top-left.
        className="flex w-[calc(100vw-2rem)] flex-col gap-0 overflow-visible border-white/[0.14] bg-surface-raised p-0 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9)] sm:max-w-lg [&>button:last-child]:hidden"
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
              {initialsOf(vaName) || '?'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="truncate text-xl">
                  {vaName || 'Work entry'}
                </SheetTitle>
                {entry && <StatusPill status={entry.status} />}
              </div>
              <SheetDescription className="mt-0.5 truncate">
                {service ? `${clientName} · ${service}` : clientName}
              </SheetDescription>
            </div>
          </header>

          {entry && (
            <>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Date" value={shortDate(entry.entryDate)} />
                  <Stat label="Started" value={entry.entryTime || '—'} />
                  <Stat label="Time spent" value={formatMinutes(entry.timeSpent)} />
                </div>

                <Section title="Task">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {entry.taskDescription || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.taskCategory}
                  </p>
                </Section>

                <Section title="Notes">
                  {entry.notes?.trim() ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {entry.notes}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60">
                      No notes added.
                    </p>
                  )}
                </Section>
              </div>

              <div className="flex items-center gap-2 border-t border-border px-6 py-3 text-xs text-muted-foreground">
                <ClockIcon className="size-3.5" />
                Logged {formatLogged(entry.createdAt)}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
