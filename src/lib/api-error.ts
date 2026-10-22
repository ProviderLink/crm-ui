import axios from 'axios';

/**
 * Message from the backend error envelope (`{ error: { message } }`), or
 * `fallback` when the request failed without one (network error, non-API
 * error). Never returns axios's generic "Request failed with status code".
 */
export function getApiError(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const message = err.response?.data?.error?.message;
  return typeof message === 'string' && message ? message : fallback;
}
