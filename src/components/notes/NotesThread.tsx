import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppSelector } from '@/hooks/store';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, MessageSquareIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { getApiError } from '@/lib/api-error';
import { addNote, listNotes } from '@/services/notes.service';
import {
  NOTE_METHODS,
  NOTE_METHOD_LABELS,
  type INote,
  type NoteMethod,
} from '@/types/note';
import { useQuery } from '@tanstack/react-query';

interface NotesThreadProps {
  /** 'client' or 'va' — selects which backend sub-resource to call. */
  subjectType: 'client' | 'va';
  /** Client._id for 'client', Candidate._id (vaId) for 'va'. */
  subjectId: string | null | undefined;
}

function queryKey(subjectType: 'client' | 'va', subjectId: string) {
  return ['admin-notes', subjectType, subjectId] as const;
}

function formatTimestamp(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotesThread({ subjectType, subjectId }: NotesThreadProps) {
  const user = useAppSelector(s => s.auth.user);
  const queryClient = useQueryClient();

  // Defense-in-depth: never fetch the thread for non-admin users, even if the
  // component were mounted by mistake. The backend route also enforces admin.
  const isAdmin = user?.role === 'admin';

  const {
    data: notes = [],
    isLoading,
    isError,
    error,
  } = useQuery<INote[], Error>({
    queryKey: queryKey(subjectType, subjectId ?? 'none'),
    queryFn: () => listNotes(subjectType, subjectId!),
    enabled: !!subjectId && isAdmin,
  });

  const [method, setMethod] = useState<NoteMethod>('other');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Hidden entirely from non-admins — they cannot see the thread or the form.
  if (!isAdmin) return null;

  async function handleAdd() {
    if (!subjectId) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await addNote(subjectType, subjectId, { method, content: trimmed });
      setContent('');
      setMethod('other');
      queryClient.invalidateQueries({
        queryKey: queryKey(subjectType, subjectId),
      });
    } catch (err: unknown) {
      setSubmitError(getApiError(err, 'Failed to add note. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white/[0.02] px-3 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquareIcon className="size-3.5 text-muted-foreground" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Admin Notes
        </p>
        <span className="ml-auto text-[10px] text-muted-foreground/60">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </span>
      </div>

      {/* Chronological thread (oldest-first) */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div
              key={i}
              className="h-16 rounded-lg bg-white/[0.03] animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          {getApiError(error, 'Failed to load notes. You may not have permission.')}
        </div>
      ) : notes.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No admin notes yet.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {notes.map(note => (
            <li
              key={note._id}
              className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 space-y-1"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-medium text-foreground">
                  {note.authorName || 'Admin'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatTimestamp(note.createdAt)}
                </span>
                <span className="ml-auto text-[10px] font-mono uppercase tracking-wider rounded px-1.5 py-0.5 bg-white/[0.04] text-[#A0A0A0] ring-1 ring-[rgba(255,255,255,0.08)]">
                  {NOTE_METHOD_LABELS[note.method] ?? note.method}
                </span>
              </div>
              <p className="text-xs text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                {note.content}
              </p>
            </li>
          ))}
        </ol>
      )}

      {/* Add note form */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <Label className="text-xs font-medium text-muted-foreground">
          Add a note
        </Label>
        <div className="flex items-start gap-2">
          <div className="w-32 shrink-0">
            <Select
              value={method}
              onValueChange={v => setMethod(v as NoteMethod)}
            >
              <SelectTrigger className="h-9 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_METHODS.map(m => (
                  <SelectItem key={m} value={m}>
                    {NOTE_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Internal note about this client… (visible only to admins)"
            className="rounded-xl text-xs resize-none"
            rows={2}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="h-7 rounded-lg text-xs gap-1"
            onClick={handleAdd}
            disabled={submitting || !content.trim()}
          >
            <PlusIcon className="size-3" />
            {submitting ? 'Adding…' : 'Add Note'}
          </Button>
          {submitError && (
            <span className="text-[11px] text-destructive">{submitError}</span>
          )}
        </div>
      </div>
    </div>
  );
}
