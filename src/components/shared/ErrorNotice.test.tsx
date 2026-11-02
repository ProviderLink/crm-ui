import { render, screen } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';

import { ErrorNotice } from './ErrorNotice';

const axiosError = (code: string, data?: unknown) =>
  new AxiosError(
    'Request failed with status code 500',
    code,
    undefined,
    null,
    data === undefined
      ? undefined
      : ({
          data,
          status: 500,
          statusText: '',
          headers: {},
          config: {},
        } as AxiosResponse)
  );

describe('ErrorNotice', () => {
  it('shows the server message when it sent one', () => {
    render(
      <ErrorNotice
        error={axiosError('ERR_BAD_RESPONSE', {
          error: { message: 'Not allowed' },
        })}
      />
    );
    expect(screen.getByRole('alert').textContent).toBe('Not allowed');
  });

  it("does not show axios's own status text", () => {
    render(<ErrorNotice error={axiosError('ERR_BAD_RESPONSE', {})} />);
    expect(screen.getByRole('alert').textContent).toBe(
      'Failed to load data. Please try again.'
    );
  });

  it('says so when the request timed out', () => {
    render(<ErrorNotice error={axiosError('ECONNABORTED')} />);
    expect(screen.getByRole('alert').textContent).toContain('took too long');
  });

  it('uses the message of an ordinary error, or the fallback', () => {
    const { rerender } = render(<ErrorNotice error={new Error('Boom')} />);
    expect(screen.getByRole('alert').textContent).toBe('Boom');
    rerender(<ErrorNotice fallback="Nope" />);
    expect(screen.getByRole('alert').textContent).toBe('Nope');
  });
});
