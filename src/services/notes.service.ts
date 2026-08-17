import api from '@/lib/api';
import type { CreateNotePayload, INote, NoteMethod } from '@/types/note';

/**
 * Admin-only internal notes thread (Requirement 4).
 *
 * Two subject types, two existing backend endpoints:
 *  - Client notes: reuse the existing /api/v1/ats/clients/:clientId/notes
 *    sub-resource (admin user has appAccess to 'ats' and 'crm').
 *  - VA notes: new /api/v1/crm/va-profiles/:vaId/notes sub-resource.
 */

type NoteSubject = 'client' | 'va';

function endpointFor(subject: NoteSubject, subjectId: string): string {
  return subject === 'client'
    ? `/ats/clients/${subjectId}/notes`
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
