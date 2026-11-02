import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDateRange } from './use-date-range';

describe('useDateRange', () => {
  it('starts on the last 30 days up to the given day', () => {
    const { result } = renderHook(() => useDateRange('2026-11-01'));
    expect(result.current.dateFrom).toBe('2026-10-02');
    expect(result.current.dateTo).toBe('2026-11-01');
    expect(result.current.isChanged).toBe(false);
  });

  it('takes another window length', () => {
    const { result } = renderHook(() => useDateRange('2026-11-01', 7));
    expect(result.current.dateFrom).toBe('2026-10-25');
  });

  it('notices a change and resets to the default window', () => {
    const { result } = renderHook(() => useDateRange('2026-11-01'));

    act(() => result.current.setDateFrom('2026-09-01'));
    expect(result.current.isChanged).toBe(true);

    act(() => result.current.reset());
    expect(result.current.dateFrom).toBe('2026-10-02');
    expect(result.current.isChanged).toBe(false);
  });

  it('follows the day until the user picks a date', () => {
    const { result, rerender } = renderHook(({ day }) => useDateRange(day), {
      initialProps: { day: '2026-11-01' },
    });
    rerender({ day: '2026-11-02' });
    expect(result.current.dateTo).toBe('2026-11-02');
    expect(result.current.dateFrom).toBe('2026-10-03');
    expect(result.current.isChanged).toBe(false);

    act(() => result.current.setDateTo('2026-10-20'));
    rerender({ day: '2026-11-03' });
    expect(result.current.dateTo).toBe('2026-10-20');
    expect(result.current.isChanged).toBe(true);
  });

  it('keeps a cleared date cleared', () => {
    const { result } = renderHook(() => useDateRange('2026-11-01'));
    act(() => result.current.setDateFrom(''));
    expect(result.current.dateFrom).toBe('');
    expect(result.current.isChanged).toBe(true);
  });
});
