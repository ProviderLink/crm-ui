export type NoteMethod = 'call' | 'email' | 'meeting' | 'message' | 'other';

export const NOTE_METHODS: NoteMethod[] = [
  'call',
  'email',
  'meeting',
  'message',
  'other',
];

export const NOTE_METHOD_LABELS: Record<NoteMethod, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  message: 'Message',
  other: 'Other',
};

export interface INote {
  _id: string;
  method: NoteMethod;
  content: string;
  author: string | null; // User id
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  method: NoteMethod;
  content: string;
}
