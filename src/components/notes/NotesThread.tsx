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
import { QK, useNotesQuery } from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { AlertCircle, PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { getApiError } from '@/lib/api-error';
import { formatDateTime } from '@/lib/format';
import { addNote } from '@/services/notes.service';
import {
  NOTE_METHODS,
  NOTE_METHOD_LABELS,
  type NoteMethod,
} from '@/types/note';

interface NotesThreadProps {
  /** 'client' or 'va' — selects which backend sub-resource to call. */
  subjectType: 'client' | 'va';
  /** Client._id for 'client', Candidate._id (vaId) for 'va'. */
  subjectId: string | null | undefined;
  /** Heading of the thread; defaults to "Internal notes". */
  title?: string;
}

export function NotesThread({
  subjectType,
  subjectId,
  title = 'Internal notes',
}: NotesThreadProps) {
  const user = useAppSelector(s => s.auth.user);

  // Defense-in-depth: never fetch the thread for anyone but staff, even if the
  // component were mounted by mistake. The backend also enforces this, and
  // limits an account manager to the VAs and clients they manage.
  const canUse = user?.role === 'admin' || user?.role === 'account_manager';

  const {
    data: notes = [],
    isLoading,
    isError,
    error,
  } = useNotesQuery(subjectType, subjectId, canUse);

  const [method, setMethod] = useState<NoteMethod>('other');
  const [content, setContent] = useState('');
  const [adding, setAdding] = useState(false);
  const add = useApiMutation({
    mutationFn: (note: { method: NoteMethod; content: string }) =>
      addNote(subjectType, subjectId!, note),
    invalidate: subjectId ? [QK.adminNotes(subjectType, subjectId)] : [],
    errorMessage: err => getApiError(err, 'Failed to add note. Please try again.'),
  });
  const submitting = add.isPending;
  const submitError = add.error;

  // Hidden entirely from everyone else — they cannot see the thread or the form.
  if (!canUse) return null;

  async function handleAdd() {
    if (!subjectId) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    if (await add.run({ method, content: trimmed })) {
      setContent('');
      setMethod('other');
      setAdding(false);
    }
  }

  return (
    <div className="border-t border-border pt-4 space-y-3">
      <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
        <span className="ml-auto text-xs text-muted-foreground">
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
          No notes yet.
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
                  {note.authorName || 'Team member'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDateTime(note.createdAt)}
                </span>
                <span className="ml-auto text-[11px] rounded px-2 py-0.5 bg-white/[0.04] text-text-secondary ring-1 ring-[rgba(255,255,255,0.08)]">
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

      {/* Add note — collapsed until asked for */}
      {!adding ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setAdding(true)}
        >
          <PlusIcon className="size-3.5" />
          Add note
        </Button>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            New note
          </Label>
          <div className="flex items-start gap-2">
            <div className="w-32 shrink-0">
              <Select
                value={method}
                onValueChange={v => setMethod(v as NoteMethod)}
              >
                <SelectTrigger className="h-9 text-xs">
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
              placeholder={`Internal note about this ${subjectType === 'va' ? 'VA' : 'client'} (visible only to your team, never to the client or VA)`}
              className="text-xs resize-none"
              rows={2}
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              onClick={handleAdd}
              disabled={submitting || !content.trim()}
            >
              {submitting ? 'Adding…' : 'Add note'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => {
                setAdding(false);
                setContent('');
                add.reset();
              }}
            >
              Cancel
            </Button>
            {submitError && (
              <span className="text-[11px] text-destructive">
                {submitError}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
