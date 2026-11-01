import { ClockIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { DetailDrawer, DrawerHeader } from '@/components/shared/DetailDrawer';
import { StatTile } from '@/components/shared/StatTile';
import { InitialsTile, WorkStatusPill } from '@/components/shared/badges';
import { SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { formatMinutes } from '@/lib/time';
import type { IWorkEntry } from '@/types/work-entry';

import { formatDate, formatDateTime } from '@/lib/format';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t border-border pt-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
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
    <DetailDrawer open={!!entry} onOpenChange={o => !o && onClose()}>
      <DrawerHeader>
        <InitialsTile name={vaName} size="md" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="truncate text-xl">
              {vaName || 'Work entry'}
            </SheetTitle>
            {entry && <WorkStatusPill status={entry.status} />}
          </div>
          <SheetDescription className="mt-0.5 truncate">
            {service ? `${clientName} · ${service}` : clientName}
          </SheetDescription>
        </div>
      </DrawerHeader>

      {entry && (
        <>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Date" value={formatDate(entry.entryDate)} />
              <StatTile label="Started" value={entry.entryTime || '—'} />
              <StatTile
                label="Time spent"
                value={formatMinutes(entry.timeSpent)}
              />
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
            Logged {formatDateTime(entry.createdAt)}
          </div>
        </>
      )}
    </DetailDrawer>
  );
}
