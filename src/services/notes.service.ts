import api from '@/lib/api';
import type { CreateNotePayload, INote, NoteMethod } from '@/types/note';

/**
 * Internal notes thread (Requirement 4), for admins and for the account manager
 * of that VA or client (the backend checks which accounts they manage).
 *
 * Both subject types use CRM endpoints:
 *  - Client notes: /api/v1/crm/client-accounts/:clientId/notes
 *  - VA notes: /api/v1/crm/va-profiles/:vaId/notes
 */

type NoteSubject = 'client' | 'va';

function endpointFor(subject: NoteSubject, subjectId: string): string {
  return subject === 'client'
    ? `/crm/client-accounts/${subjectId}/notes`
    : `/crm/va-profiles/${subjectId}/notes`;
}

export async function listNotes(
  subject: NoteSubject,
  subjectId: string
): Promise<INote[]> {
  const { data } = await api.get<{ data: INote[] }>(
    endpointFor(subject, subjectId)
  );
  // Client endpoint returns newest-first; VA endpoint returns oldest-first.
  // Normalize to oldest-first for the continuous-thread UI.
  const notes = data.data ?? [];
  if (subject === 'client') {
    return [...notes].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
  return notes;
}

export async function addNote(
  subject: NoteSubject,
  subjectId: string,
  payload: CreateNotePayload
): Promise<INote> {
  const { data } = await api.post<{ data: INote }>(
    endpointFor(subject, subjectId),
    payload
  );
  return data.data;
}

// Re-export for callers that need to build payloads without importing types/note.
export type { CreateNotePayload, NoteMethod };
