import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDateRange } from './use-date-range';

describe('useDateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 1, 12, 0, 0)); // 1 Nov 2026, local
  });
  afterEach(() => vi.useRealTimers());

  it('starts on the last 30 days', () => {
    const { result } = renderHook(() => useDateRange());
    expect(result.current.dateFrom).toBe('2026-10-02');
    expect(result.current.dateTo).toBe('2026-11-01');
    expect(result.current.isChanged).toBe(false);
  });

  it('takes another window length', () => {
    const { result } = renderHook(() => useDateRange(7));
    expect(result.current.dateFrom).toBe('2026-10-25');
  });

  it('notices a change and resets to the default window', () => {
    const { result } = renderHook(() => useDateRange());

    act(() => result.current.setDateFrom('2026-09-01'));
    expect(result.current.isChanged).toBe(true);

    act(() => result.current.reset());
    expect(result.current.dateFrom).toBe('2026-10-02');
    expect(result.current.isChanged).toBe(false);
  });

  it('keeps the default window when the day rolls over', () => {
    const { result, rerender } = renderHook(() => useDateRange());
    vi.setSystemTime(new Date(2026, 10, 3, 12, 0, 0));
    rerender();
    expect(result.current.dateTo).toBe('2026-11-01');
    expect(result.current.isChanged).toBe(false);
  });
});
