import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useApiMutation } from './use-api-mutation';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function setup() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidate };
}

describe('useApiMutation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the result and refreshes the listed queries', async () => {
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(
      () =>
        useApiMutation({
          mutationFn: async (n: number) => n * 2,
          invalidate: [['a'], ['b', 1]],
          errorMessage: 'failed',
        }),
      { wrapper }
    );

    let value: number | undefined;
    await act(async () => {
      value = await result.current.run(21);
    });

    expect(value).toBe(42);
    expect(result.current.error).toBeNull();
    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['a'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['b', 1] });
  });

  it('shows the success message when given one', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () =>
        useApiMutation({
          mutationFn: async () => 'ok',
          successMessage: 'Saved.',
          errorMessage: 'failed',
        }),
      { wrapper }
    );
    await act(async () => {
      await result.current.run();
    });
    expect(toast.success).toHaveBeenCalledWith('Saved.');
  });

  it('never throws: a failure gives undefined and an error message', async () => {
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(
      () =>
        useApiMutation({
          mutationFn: async (): Promise<string> => {
            throw new Error('server said no');
          },
          invalidate: [['a']],
          errorMessage: 'Could not save.',
        }),
      { wrapper }
    );

    let value: string | undefined = 'unset';
    await act(async () => {
      value = await result.current.run();
    });

    expect(value).toBeUndefined();
    await waitFor(() => expect(result.current.error).toBe('Could not save.'));
    expect(invalidate).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('builds the message from the error, and toasts it on request', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () =>
        useApiMutation({
          mutationFn: async (): Promise<string> => {
            throw new Error('duplicate email');
          },
          errorMessage: err => `Failed: ${(err as Error).message}`,
          toastError: true,
        }),
      { wrapper }
    );
    await act(async () => {
      await result.current.run();
    });
    await waitFor(() =>
      expect(result.current.error).toBe('Failed: duplicate email')
    );
    expect(toast.error).toHaveBeenCalledWith('Failed: duplicate email');
  });

  it('clears the error on reset', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () =>
        useApiMutation({
          mutationFn: async (): Promise<string> => {
            throw new Error('x');
          },
          errorMessage: 'failed',
        }),
      { wrapper }
    );
    await act(async () => {
      await result.current.run();
    });
    await waitFor(() => expect(result.current.error).toBe('failed'));
    act(() => result.current.reset());
    await waitFor(() => expect(result.current.error).toBeNull());
  });

  it('keeps run stable between renders', () => {
    const { wrapper } = setup();
    const { result, rerender } = renderHook(
      () =>
        useApiMutation({
          mutationFn: async () => 1,
          errorMessage: 'failed',
        }),
      { wrapper }
    );
    const first = result.current.run;
    rerender();
    expect(result.current.run).toBe(first);
  });
});
