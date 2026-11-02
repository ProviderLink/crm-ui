import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';

import { NoCrmAccessError } from '@/services/auth.service';

import { authErrorMessage, NO_ACCESS_MESSAGE } from './auth-errors';

const withStatus = (status: number) =>
  new AxiosError('x', 'ERR_BAD_REQUEST', undefined, null, {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: {},
  } as AxiosResponse);

describe('authErrorMessage', () => {
  it('says the credentials were wrong when the server rejected them', () => {
    expect(
      authErrorMessage(withStatus(401), 'Invalid email or password.')
    ).toBe('Invalid email or password.');
    expect(authErrorMessage(withStatus(400), 'Bad link.')).toBe('Bad link.');
  });

  it('has a message for rate limiting', () => {
    expect(authErrorMessage(withStatus(429), 'x')).toContain('Too many');
  });

  it('says there is no CRM access', () => {
    expect(authErrorMessage(withStatus(403), 'x')).toBe(NO_ACCESS_MESSAGE);
    expect(authErrorMessage(new NoCrmAccessError(), 'x')).toBe(
      NO_ACCESS_MESSAGE
    );
  });

  it('does not blame the user for a server error', () => {
    expect(authErrorMessage(withStatus(500), 'Invalid')).toContain(
      'Something went wrong'
    );
  });

  it('tells a lost connection from a timeout', () => {
    const offline = new AxiosError('Network Error', 'ERR_NETWORK');
    const slow = new AxiosError('timeout', 'ECONNABORTED');
    expect(authErrorMessage(offline, 'x')).toContain('Unable to connect');
    expect(authErrorMessage(slow, 'x')).toContain('too long');
  });

  it('falls back for anything else', () => {
    expect(authErrorMessage(new Error('boom'), 'x')).toContain(
      'Something went wrong'
    );
  });
});
