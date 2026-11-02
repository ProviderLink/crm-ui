import axios from 'axios';

import { NoCrmAccessError } from '@/services/auth.service';

export const NO_ACCESS_MESSAGE =
  'Your account does not have access to the CRM. Contact your administrator.';

/**
 * The one sentence to show when a sign-in, reset or invitation call fails.
 * `rejected` is what to say when the server answered "no" (a wrong password,
 * an expired link); the rest is the same on every auth page.
 */
export function authErrorMessage(err: unknown, rejected: string): string {
  if (err instanceof NoCrmAccessError) return NO_ACCESS_MESSAGE;
  if (!axios.isAxiosError(err))
    return 'Something went wrong. Please try again.';
  if (!err.response) {
    return err.code === 'ECONNABORTED'
      ? 'The request took too long. Please try again.'
      : 'Unable to connect. Check your internet and try again.';
  }
  const { status } = err.response;
  if (status === 429)
    return 'Too many attempts. Please wait a few minutes and try again.';
  if (status === 403) return NO_ACCESS_MESSAGE;
  if (status >= 500) return 'Something went wrong. Please try again.';
  return rejected;
}
