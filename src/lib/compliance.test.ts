import { describe, expect, it } from 'vitest';

import { eodComplianceRate, isReportDue, isWorkingDay } from './compliance';

// 2026-11-02 is a Monday; 2026-11-07 and 2026-11-08 are the weekend.
const active = (startDate: string, _id = 'a1') => ({
  _id,
  status: 'active' as const,
  startDate,
});

describe('isWorkingDay', () => {
  it('is Monday to Friday', () => {
    expect(isWorkingDay('2026-11-02')).toBe(true);
    expect(isWorkingDay('2026-11-06')).toBe(true);
    expect(isWorkingDay('2026-11-07')).toBe(false);
    expect(isWorkingDay('2026-11-08')).toBe(false);
  });
});

describe('isReportDue', () => {
  it('is due on a working day once the assignment has started', () => {
    expect(isReportDue(active('2026-10-01'), '2026-11-03')).toBe(true);
    expect(isReportDue(active('2026-11-03'), '2026-11-03')).toBe(true);
  });

  it('is not due before the start date or at the weekend', () => {
    expect(isReportDue(active('2026-11-04'), '2026-11-03')).toBe(false);
    expect(isReportDue(active('2026-10-01'), '2026-11-07')).toBe(false);
  });

  it('is not due for an assignment on hold or ended', () => {
    const held = { status: 'on_hold' as const, startDate: '2026-10-01' };
    const ended = { status: 'ended' as const, startDate: '2026-10-01' };
    expect(isReportDue(held, '2026-11-03')).toBe(false);
    expect(isReportDue(ended, '2026-11-03')).toBe(false);
  });
});

describe('eodComplianceRate', () => {
  const eod = (day: string, assignmentId = 'a1') => ({
    assignmentId,
    date: day,
  });

  it('counts only working days since the assignment started', () => {
    // Today is Wednesday 4 Nov; the week has Mon, Tue, Wed so far, plus the
    // previous Thu and Fri in the 7-day window.
    const a = active('2026-10-01');
    const eods = [eod('2026-11-04'), eod('2026-11-03')];
    // Due: Thu 29, Fri 30, Mon 2, Tue 3, Wed 4 -> 2 of 5.
    expect(eodComplianceRate([a], eods, '2026-11-04')).toBe(40);
  });

  it('does not count days before the start date as missed', () => {
    const a = active('2026-11-03');
    // Due: Tue 3 and Wed 4 only.
    expect(eodComplianceRate([a], [eod('2026-11-03')], '2026-11-04')).toBe(50);
  });

  it('is null when nothing was due', () => {
    expect(eodComplianceRate([], [], '2026-11-04')).toBeNull();
    // Weekend-only window of a new assignment.
    expect(
      eodComplianceRate([active('2026-11-07')], [], '2026-11-08', 2)
    ).toBeNull();
  });

  it('keeps assignments of one VA apart', () => {
    const a1 = active('2026-11-02', 'a1');
    const a2 = active('2026-11-02', 'a2');
    expect(
      eodComplianceRate([a1, a2], [eod('2026-11-02', 'a1')], '2026-11-02', 1)
    ).toBe(50);
  });
});
