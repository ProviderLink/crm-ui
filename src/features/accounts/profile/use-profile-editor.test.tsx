import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { UpdateClientAccountPayload } from '@/types/client-account';

import { useProfileEditor } from './use-profile-editor';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={
      new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    }
  >
    {children}
  </QueryClientProvider>
);

const stored = {
  healthStatus: 'green',
  emrSystem: 'Epic',
  openIssuesCount: 2,
} as const;

function setup(
  mutationFn: (payload: UpdateClientAccountPayload) => Promise<unknown> = vi.fn(
    async () => ({})
  )
) {
  const hook = renderHook(
    () =>
      useProfileEditor<UpdateClientAccountPayload>({
        source: stored,
        mutationFn,
        invalidate: [['profile']],
      }),
    { wrapper }
  );
  return { ...hook, mutationFn };
}

describe('useProfileEditor', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('starts closed and reads values from the stored profile', () => {
    const { result } = setup();
    expect(result.current.editing).toBe(false);
    expect(result.current.value('emrSystem')).toBe('Epic');
    expect(result.current.value('notes')).toBeUndefined();
  });

  it('prefers what was typed over what is stored', () => {
    const { result } = setup();
    act(() => result.current.startEdit());
    act(() => result.current.set('emrSystem', 'Cerner'));
    expect(result.current.editing).toBe(true);
    expect(result.current.value('emrSystem')).toBe('Cerner');
    expect(result.current.value('openIssuesCount')).toBe(2);
  });

  it('keeps a value cleared to null rather than falling back to the stored one', () => {
    const { result } = setup();
    act(() => result.current.set('satisfactionScore', null));
    expect(result.current.value('satisfactionScore')).toBeNull();
  });

  it('sends only the fields that were changed', async () => {
    const { result, mutationFn } = setup();
    act(() => result.current.startEdit());
    act(() => result.current.set('emrSystem', 'Cerner'));
    await act(async () => {
      await result.current.submit();
    });
    expect(vi.mocked(mutationFn)).toHaveBeenCalledTimes(1);
    // The payload is the first argument; the query client adds its own after it.
    expect(vi.mocked(mutationFn).mock.calls[0]?.[0]).toEqual({
      emrSystem: 'Cerner',
    });
  });

  it('shows Saved, then closes the form and drops the draft', async () => {
    const { result } = setup();
    act(() => result.current.startEdit());
    act(() => result.current.set('emrSystem', 'Cerner'));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.success).toBe(true);
    expect(result.current.editing).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(result.current.editing).toBe(false);
    expect(result.current.success).toBe(false);
    expect(result.current.value('emrSystem')).toBe('Epic');
  });

  it('keeps the form open and shows an error when saving fails', async () => {
    const failing = vi.fn(async (): Promise<unknown> => {
      throw new Error('nope');
    });
    const { result } = setup(failing);
    act(() => result.current.startEdit());
    act(() => result.current.set('emrSystem', 'Cerner'));
    await act(async () => {
      await result.current.submit();
    });
    await waitFor(() =>
      expect(result.current.error).toBe('Failed to save. Please try again.')
    );
    expect(result.current.success).toBe(false);
    expect(result.current.editing).toBe(true);
    expect(result.current.value('emrSystem')).toBe('Cerner');
  });

  it('closes on cancel and clears the error', async () => {
    const failing = vi.fn(async (): Promise<unknown> => {
      throw new Error('nope');
    });
    const { result } = setup(failing);
    act(() => result.current.startEdit());
    await act(async () => {
      await result.current.submit();
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    act(() => result.current.cancel());
    expect(result.current.editing).toBe(false);
    await waitFor(() => expect(result.current.error).toBeNull());
  });

  it('starts a new edit from a clean draft', () => {
    const { result } = setup();
    act(() => result.current.set('emrSystem', 'Cerner'));
    act(() => result.current.startEdit());
    expect(result.current.value('emrSystem')).toBe('Epic');
  });
});
