import { useEffect, useRef, useState } from 'react';

import { useApiMutation } from '@/hooks/use-api-mutation';

const SAVED_MESSAGE_MS = 1200;

/**
 * Edit state of a profile card: the fields changed so far (`draft`), and the
 * save with its "Saved" confirmation. Only changed fields are sent.
 *
 * `value(key)` reads the draft first and the saved profile after it, so a form
 * shows what the user typed or else what is stored.
 */
export function useProfileEditor<TPayload extends object>({
  source,
  mutationFn,
  invalidate,
}: {
  /** The profile as stored; undefined while there is none. */
  source: Partial<TPayload> | undefined;
  mutationFn: (payload: TPayload) => Promise<unknown>;
  /** Query keys to refresh after a save. */
  invalidate: readonly (readonly unknown[])[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<TPayload>>({});
  const [success, setSuccess] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const save = useApiMutation({
    mutationFn,
    invalidate,
    awaitInvalidate: true,
    errorMessage: 'Failed to save. Please try again.',
  });

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  function startEdit() {
    setDraft({});
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    save.reset();
    setSuccess(false);
  }

  async function submit() {
    setSuccess(false);
    if (!(await save.run(draft as TPayload))) return;
    setSuccess(true);
    // Leave the "Saved" message up for a moment, then close the form.
    closeTimer.current = window.setTimeout(() => {
      setEditing(false);
      setDraft({});
      setSuccess(false);
    }, SAVED_MESSAGE_MS);
  }

  function value<K extends keyof TPayload>(key: K): TPayload[K] | undefined {
    return (draft[key] !== undefined ? draft[key] : source?.[key]) as
      | TPayload[K]
      | undefined;
  }

  function set<K extends keyof TPayload>(key: K, next: TPayload[K]) {
    setDraft(prev => ({ ...prev, [key]: next }));
  }

  return {
    editing,
    startEdit,
    cancel,
    submit,
    value,
    set,
    saving: save.isPending,
    error: save.error,
    success,
  };
}

export type ProfileEditor<TPayload extends object> = ReturnType<
  typeof useProfileEditor<TPayload>
>;
