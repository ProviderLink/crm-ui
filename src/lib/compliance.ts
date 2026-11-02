import { addDaysToDateKey, weekdayOfDateKey } from '@/lib/time';
import type { IAssignment } from '@/types/assignment';
import type { IEodSubmission } from '@/types/eod-submission';

/** Monday to Friday; a daily report is not expected at the weekend. */
export function isWorkingDay(dayKey: string): boolean {
  const weekday = weekdayOfDateKey(dayKey);
  return weekday >= 1 && weekday <= 5;
}

/**
 * Whether the VA on this assignment owes a daily report on `dayKey`: the
 * assignment is active, has started, and the day is a working day.
 */
export function isReportDue(
  assignment: Pick<IAssignment, 'status' | 'startDate'>,
  dayKey: string
): boolean {
  return (
    assignment.status === 'active' &&
    assignment.startDate.slice(0, 10) <= dayKey &&
    isWorkingDay(dayKey)
  );
}

/**
 * Share of the reports due over the last `days` days (ending `today`) that
 * were filed, as a whole percent; null when none were due.
 */
export function eodComplianceRate(
  assignments: Pick<IAssignment, '_id' | 'status' | 'startDate'>[],
  eods: Pick<IEodSubmission, 'assignmentId' | 'date'>[],
  today: string,
  days = 7
): number | null {
  const filed = new Set(eods.map(e => `${e.assignmentId}::${e.date}`));
  let due = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const day = addDaysToDateKey(today, -i);
    for (const a of assignments) {
      if (!isReportDue(a, day)) continue;
      due++;
      if (filed.has(`${a._id}::${day}`)) done++;
    }
  }
  return due > 0 ? Math.round((done / due) * 100) : null;
}
