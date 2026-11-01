import { Edit3Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NotesThread } from '@/features/notes/NotesThread';
import {
  QK,
  useClientAccountQuery,
  useClientAssignmentsQuery,
  useHiredVasForClientQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { updateClientAccount } from '@/services/client-accounts.service';
import type { UpdateClientAccountPayload } from '@/types/client-account';

import { ClientProfileForm } from './profile/ClientProfileForm';
import { ClientProfileView } from './profile/ClientProfileView';
import { ProfileHeader } from './profile/parts';
import { useProfileEditor } from './profile/use-profile-editor';

/** A client's CRM profile in the account sheet: view, edit, and notes. */
export function ClientProfileSection({ clientId }: { clientId: string }) {
  const user = useAppSelector(s => s.auth.user);
  // Editing a client is admin-only; account managers can read it and add notes.
  const canEdit = user?.role === 'admin';

  const { data: account, isLoading } = useClientAccountQuery(clientId);
  const { data: hiredVas = [] } = useHiredVasForClientQuery(clientId);
  const { data: assignments = [] } = useClientAssignmentsQuery(clientId);

  const editor = useProfileEditor<UpdateClientAccountPayload>({
    source: account ?? undefined,
    mutationFn: payload => updateClientAccount(clientId, payload),
    // The Accounts table enriches its rows from the list too.
    invalidate: [QK.clientAccount(clientId), QK.clientAccountsList],
  });

  if (isLoading) {
    return (
      <div className="space-y-3 border-t border-border pt-4">
        <p className="animate-pulse text-xs text-muted-foreground">
          Loading profile…
        </p>
      </div>
    );
  }

  // With no profile yet, show the empty state until the admin starts editing.
  if (!account && !editor.editing) {
    return (
      <div className="space-y-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground italic">
          {canEdit
            ? 'No CRM profile yet — create one by editing.'
            : 'No CRM profile yet.'}
        </p>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={editor.startEdit}
          >
            <Edit3Icon className="mr-1.5 size-3" />
            Add Profile
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <ProfileHeader
        canEdit={canEdit}
        editing={editor.editing}
        onEdit={editor.startEdit}
      />

      {editor.editing ? (
        <ClientProfileForm editor={editor} />
      ) : account ? (
        <ClientProfileView
          account={account}
          vaCount={hiredVas.length}
          activeAssignments={
            assignments.filter(a => a.status === 'active').length
          }
          totalAssignments={assignments.length}
        />
      ) : null}

      {/* Internal notes thread: staff only */}
      <NotesThread subjectType="client" subjectId={clientId} />
    </div>
  );
}
