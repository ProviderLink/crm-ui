import axios from 'axios';
import { TriangleAlert } from 'lucide-react';

import { getApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';

/**
 * A failed load, said plainly, in place of data that would otherwise read as
 * "nothing here". `error` may be the query's error; the server's own message
 * is used when it sent one.
 */
export function ErrorNotice({
  error,
  fallback = 'Failed to load data. Please try again.',
  className,
}: {
  error?: unknown;
  fallback?: string;
  className?: string;
}) {
  // The server's message when it sent one. axios's own text ("Request failed
  // with status code 500") says nothing useful, so a request failure without
  // a server message uses `fallback`.
  const message = axios.isAxiosError(error)
    ? error.code === 'ECONNABORTED'
      ? 'The request took too long. Please try again.'
      : getApiError(error, fallback)
    : error instanceof Error && error.message
      ? error.message
      : fallback;
  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm text-status-error',
        className
      )}
    >
      <TriangleAlert className="size-4 shrink-0" />
      {message}
    </div>
  );
}
