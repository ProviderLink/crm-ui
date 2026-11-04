import type { IWorkEntry } from '@/types/work-entry';

import { DEFAULT_WORK_ENTRY, type FormData } from './schema';

type EodRow = FormData['workEntries'][number];

/** One report row per work entry logged today, for the VA to check and edit. */
export function rowsFromWorkEntries(entries: IWorkEntry[]): EodRow[] {
  return entries.map(entry => ({
    task: entry.taskCategory,
    description: entry.taskDescription,
    // Work entries have no quantity; each one is a single piece of work.
    quantity: 1,
    status: entry.status,
    timeSpent: entry.timeSpent,
  }));
}

const sameRow = (a: EodRow, b: EodRow) =>
  a.task === b.task &&
  a.description === b.description &&
  a.quantity === b.quantity &&
  a.status === b.status &&
  a.timeSpent === b.timeSpent;

export const sameRows = (a: EodRow[], b: EodRow[]) =>
  a.length === b.length && a.every((row, i) => sameRow(row, b[i]!));

/**
 * Whether the rows can be replaced without losing anything the VA typed: they
 * are still the empty starting row, or exactly what was last filled in.
 */
export const canReplaceRows = (current: EodRow[], lastFilled: EodRow[]) =>
  sameRows(current, [DEFAULT_WORK_ENTRY]) ||
  (lastFilled.length > 0 && sameRows(current, lastFilled));
