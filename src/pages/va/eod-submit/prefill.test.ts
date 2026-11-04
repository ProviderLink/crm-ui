import { describe, expect, it } from 'vitest';

import type { IWorkEntry } from '@/types/work-entry';

import { canReplaceRows, rowsFromWorkEntries } from './prefill';
import { DEFAULT_WORK_ENTRY } from './schema';

const entry = {
  taskCategory: 'Scheduling',
  taskDescription: 'Booked 5 visits',
  timeSpent: 90,
  status: 'in_progress',
} as IWorkEntry;

describe('rowsFromWorkEntries', () => {
  it('maps each work entry to a report row', () => {
    expect(rowsFromWorkEntries([entry])).toEqual([
      {
        task: 'Scheduling',
        description: 'Booked 5 visits',
        quantity: 1,
        status: 'in_progress',
        timeSpent: 90,
      },
    ]);
  });
});

describe('canReplaceRows', () => {
  const filled = rowsFromWorkEntries([entry]);

  it('allows replacing the empty starting row', () => {
    expect(canReplaceRows([DEFAULT_WORK_ENTRY], [])).toBe(true);
  });

  it('allows replacing rows that are unchanged since they were filled', () => {
    expect(canReplaceRows(filled, filled)).toBe(true);
  });

  it('keeps rows the VA has edited', () => {
    const edited = [{ ...filled[0]!, description: 'Booked 6 visits' }];
    expect(canReplaceRows(edited, filled)).toBe(false);
  });

  it('keeps rows the VA typed before anything was filled', () => {
    const typed = [{ ...DEFAULT_WORK_ENTRY, task: 'Calls' }];
    expect(canReplaceRows(typed, [])).toBe(false);
  });
});
