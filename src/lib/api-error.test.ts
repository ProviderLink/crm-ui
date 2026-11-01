import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';

import { getApiError } from './api-error';

function apiError(data: unknown) {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, null, {
    data,
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: {} as AxiosResponse['config'],
  });
}

describe('getApiError', () => {
  it('uses the message from the backend error envelope', () => {
    expect(
      getApiError(apiError({ error: { message: 'Email already used' } }), 'x')
    ).toBe('Email already used');
  });

  it('falls back when the reply has no message', () => {
    expect(getApiError(apiError({}), 'Something failed')).toBe(
      'Something failed'
    );
    expect(getApiError(apiError({ error: { message: '' } }), 'Nope')).toBe(
      'Nope'
    );
  });

  it('falls back for errors that are not from a request', () => {
    expect(getApiError(new Error('boom'), 'Fallback')).toBe('Fallback');
    expect(getApiError('text', 'Fallback')).toBe('Fallback');
  });
});
