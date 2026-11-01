import { DetailDrawer, DrawerHeader } from '@/components/shared/DetailDrawer';
import { InitialsTile, WorkStatusPill } from '@/components/shared/badges';
import { SheetDescription, SheetTitle } from '@/components/ui/sheet';
import type { IWorkEntry } from '@/types/work-entry';

import { formatDate } from '@/lib/format';
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
    <DetailDrawer open={!!entry} onOpenChange={o => !o && onClose()}>
      <DrawerHeader>
        <InitialsTile name={clientName} size="md" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="truncate text-xl">
              Edit work entry
            </SheetTitle>
            {entry && <WorkStatusPill status={entry.status} />}
          </div>
          <SheetDescription className="mt-0.5 truncate">
            {[clientName, service, entry && formatDate(entry.entryDate)]
              .filter(Boolean)
              .join(' · ')}
          </SheetDescription>
        </div>
      </DrawerHeader>

      {entry && (
        <EditWorkEntryForm
          key={entry._id}
          entry={entry}
          onSuccess={onSaved}
          onCancel={onClose}
        />
      )}
    </DetailDrawer>
  );
}
