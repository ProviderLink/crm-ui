import { useCallback } from 'react';
import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { toast } from 'sonner';

interface Options<TData, TVars> {
  mutationFn: (vars: TVars) => Promise<TData>;
  /** Query keys (prefixes) to refresh after a successful call. */
  invalidate?: readonly QueryKey[];
  /** Wait for the refresh before `run` resolves (default: do not wait). */
  awaitInvalidate?: boolean;
  /** Toast shown on success. */
  successMessage?: string;
  /**
   * Shown when the call fails. A function receives the error, for messages
   * taken from the server's reply (see `getApiError`).
   */
  errorMessage: string | ((error: unknown) => string);
  /** Also show the failure as a toast; it is always returned as `error`. */
  toastError?: boolean;
}

/**
 * One way to save something: call it, refresh the affected queries, tell the
 * user. `run` never throws; it resolves to the result, or `undefined` when the
 * call failed, and the failure is in `error`.
 */
export function useApiMutation<TData = unknown, TVars = void>({
  mutationFn,
  invalidate = [],
  awaitInvalidate = false,
  successMessage,
  errorMessage,
  toastError = false,
}: Options<TData, TVars>) {
  const queryClient = useQueryClient();
  const mutation = useMutation<TData, unknown, TVars>({
    mutationFn,
    onSuccess: async () => {
      const refresh = Promise.all(
        invalidate.map(queryKey => queryClient.invalidateQueries({ queryKey }))
      );
      if (awaitInvalidate) await refresh;
      if (successMessage) toast.success(successMessage);
    },
    onError: err => {
      if (toastError) toast.error(resolve(errorMessage, err));
    },
  });

  // Stable between renders, so callers can list it as a dependency.
  const { mutateAsync } = mutation;
  const run = useCallback(
    async (vars: TVars): Promise<TData | undefined> => {
      try {
        return await mutateAsync(vars);
      } catch {
        return undefined;
      }
    },
    [mutateAsync]
  );

  return {
    run,
    isPending: mutation.isPending,
    error: mutation.isError ? resolve(errorMessage, mutation.error) : null,
    reset: mutation.reset,
  };
}

function resolve(
  message: Options<unknown, unknown>['errorMessage'],
  err: unknown
): string {
  return typeof message === 'function' ? message(err) : message;
}
