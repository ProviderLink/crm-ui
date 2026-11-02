import { describe, expect, it } from 'vitest';

import {
  addDaysToDateKey,
  calcHours,
  daysUntil,
  dateKeyToLocalDate,
  formatDateKeyLong,
  formatDateKeyShort,
  formatMinutes,
  nowTimeInZone,
  weekdayOfDateKey,
  weekStartOfDateKey,
} from './time';

describe('formatMinutes', () => {
  it('shows minutes under an hour', () => {
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(0)).toBe('0m');
  });

  it('shows hours, with minutes when there are any', () => {
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(90)).toBe('1h 30m');
    expect(formatMinutes(125)).toBe('2h 5m');
  });
});

describe('calcHours', () => {
  it('is the decimal hours between two times', () => {
    expect(calcHours('09:00', '17:30')).toBe(8.5);
    expect(calcHours('09:15', '10:00')).toBe(0.75);
  });

  it('treats an earlier end as an overnight shift', () => {
    expect(calcHours('22:00', '02:00')).toBe(4);
  });

  it('is 0 when either time is missing', () => {
    expect(calcHours('', '17:00')).toBe(0);
    expect(calcHours('09:00', '')).toBe(0);
  });
});

describe('date keys', () => {
  it('adds days across month and year ends', () => {
    expect(addDaysToDateKey('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysToDateKey('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDaysToDateKey('2026-03-01', -30)).toBe('2026-01-30');
  });

  it('does not drift over a daylight-saving change', () => {
    // US clocks change on 8 March and 1 November 2026.
    expect(addDaysToDateKey('2026-03-07', 2)).toBe('2026-03-09');
    expect(addDaysToDateKey('2026-10-31', 2)).toBe('2026-11-02');
  });

  it('returns an invalid key unchanged', () => {
    expect(addDaysToDateKey('not-a-date', 3)).toBe('not-a-date');
  });

  it('finds the weekday, with 0 as Sunday', () => {
    expect(weekdayOfDateKey('2026-11-01')).toBe(0);
    expect(weekdayOfDateKey('2026-11-02')).toBe(1);
  });

  it('finds the Monday of the week', () => {
    expect(weekStartOfDateKey('2026-11-01')).toBe('2026-10-26'); // a Sunday
    expect(weekStartOfDateKey('2026-11-02')).toBe('2026-11-02'); // a Monday
    expect(weekStartOfDateKey('2026-11-05')).toBe('2026-11-02');
  });

  it('counts whole days between two keys', () => {
    expect(daysUntil('2026-11-10', '2026-11-01')).toBe(9);
    expect(daysUntil('2026-11-01', '2026-11-01')).toBe(0);
    expect(daysUntil('2026-10-25', '2026-11-01')).toBe(-7);
  });

  it('formats a key from its parts, so the day never shifts', () => {
    expect(formatDateKeyShort('2026-03-04')).toBe('Mar 4');
    expect(formatDateKeyLong('2026-03-04')).toBe('Mar 4, 2026');
    expect(formatDateKeyLong('2026-03-04T23:30:00.000Z')).toBe('Mar 4, 2026');
  });

  it('falls back to the raw value when it is not a date', () => {
    expect(formatDateKeyShort('soon')).toBe('soon');
  });

  it('builds a local date, or null when invalid', () => {
    const d = dateKeyToLocalDate('2026-03-04');
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(2);
    expect(d?.getDate()).toBe(4);
    expect(dateKeyToLocalDate('nope')).toBeNull();
  });
});

describe('nowTimeInZone', () => {
  it('is an HH:MM wall-clock time', () => {
    expect(nowTimeInZone('Asia/Dhaka')).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
  });

  it('falls back to the device clock for no zone or a bad one', () => {
    expect(nowTimeInZone(null)).toMatch(/^\d\d:\d\d$/);
    expect(nowTimeInZone('Not/AZone')).toMatch(/^\d\d:\d\d$/);
  });
});
