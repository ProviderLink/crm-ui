import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEodSubmitForm } from './use-eod-submit-form';

const logged = {
  A: [
    {
      entryDate: '2026-11-04',
      taskCategory: 'Scheduling',
      taskDescription: 'Booked visits',
      timeSpent: 60,
      status: 'completed',
    },
  ],
  B: [] as unknown[],
};

let assignments: { _id: string }[];

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/hooks/useMyAssignments', () => ({
  useMyAssignments: () => ({ assignments, isLoading: false, isError: false }),
}));
vi.mock('@/hooks/use-api-mutation', () => ({
  useApiMutation: () => ({ run: vi.fn(), error: null }),
}));
vi.mock('@/hooks/queries', () => ({
  QK: { eodSubmissionsAll: [], eodContext: [] },
  useCompanyDay: () => ({
    today: '2026-11-04',
    timezone: 'America/Chicago',
    isLoading: false,
  }),
  useEodSubmissionsQuery: () => ({ data: [], isLoading: false }),
  useWorkEntriesQuery: (filters: { assignmentId?: string }) => ({
    data: filters.assignmentId
      ? logged[filters.assignmentId as 'A' | 'B']
      : undefined,
  }),
}));

const rows = (r: { current: ReturnType<typeof useEodSubmitForm> }) =>
  r.current.workFields.map(f => [f.task, f.description]);

describe('useEodSubmitForm prefill', () => {
  beforeEach(() => {
    assignments = [{ _id: 'A' }, { _id: 'B' }];
  });

  it('fills rows from the log, and clears them on an assignment with none', async () => {
    const { result } = renderHook(() => useEodSubmitForm());
    expect(result.current.prefilledCount).toBe(0);

    act(() => result.current.setValue('assignmentId', 'A'));
    await waitFor(() =>
      expect(rows(result)).toEqual([['Scheduling', 'Booked visits']])
    );
    expect(result.current.prefilledCount).toBe(1);

    act(() => result.current.setValue('assignmentId', 'B'));
    await waitFor(() => expect(rows(result)).toEqual([['', '']]));
    expect(result.current.prefilledCount).toBe(0);
  });

  it('does not overwrite what the VA already typed', async () => {
    const { result } = renderHook(() => useEodSubmitForm());
    act(() => result.current.setValue('workEntries.0.task', 'My own task'));
    act(() => result.current.setValue('assignmentId', 'A'));
    await waitFor(() => expect(result.current.prefilledCount).toBe(0));
    expect(result.current.control._getWatch('workEntries.0.task')).toBe(
      'My own task'
    );
  });
});
