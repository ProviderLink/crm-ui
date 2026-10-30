import { XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import type { IWorkEntry } from '@/types/work-entry';

import { initialsOf, shortDate } from '../../admin/work-entries/format';
import { StatusPill } from '../../admin/work-entries/StatusPill';
import { EditWorkEntryForm } from './EditWorkEntryForm';

/**
 * A work entry opened for editing in a floating drawer over the list. The form
 * only mounts while an entry is open, so it is seeded fresh each time.
 */
export function EditWorkEntryDrawer({
  entry,
  clientName,
  service,
  onClose,
  onSaved,
}: {
  entry: IWorkEntry | null;
  clientName: string;
  service?: string;
  onClose: () => void;
  onSaved: () => void;
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
              {initialsOf(clientName) || '?'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="truncate text-xl">
                  Edit work entry
                </SheetTitle>
                {entry && <StatusPill status={entry.status} />}
              </div>
              <SheetDescription className="mt-0.5 truncate">
                {[clientName, service, entry && shortDate(entry.entryDate)]
                  .filter(Boolean)
                  .join(' · ')}
              </SheetDescription>
            </div>
          </header>

          {entry && (
            <EditWorkEntryForm
              key={entry._id}
              entry={entry}
              onSuccess={onSaved}
              onCancel={onClose}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
