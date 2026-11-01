import { describe, expect, it } from 'vitest';

import {
  formatDate,
  formatDateTime,
  formatDateWeekday,
  initialsOf,
  plural,
} from './format';

describe('initialsOf', () => {
  it('takes up to two initials, upper-cased', () => {
    expect(initialsOf('ayesha rahman')).toBe('AR');
    expect(initialsOf('Mary Jane Watson')).toBe('MJ');
    expect(initialsOf('Cher')).toBe('C');
  });

  it('is empty for an empty name', () => {
    expect(initialsOf('')).toBe('');
  });
});

describe('plural', () => {
  it('adds an s except for one', () => {
    expect(plural(1, 'day')).toBe('1 day');
    expect(plural(0, 'day')).toBe('0 days');
    expect(plural(3, 'report')).toBe('3 reports');
  });
});

describe('formatDate', () => {
  it('formats a date key or ISO string', () => {
    expect(formatDate('2026-10-27')).toBe('Oct 27, 2026');
    expect(formatDate('2026-10-27T18:00:00.000Z')).toBe('Oct 27, 2026');
  });

  it('shows a dash when missing or invalid', () => {
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate(null)).toBe('—');
    expect(formatDate('garbage')).toBe('—');
  });
});

describe('formatDateWeekday', () => {
  it('adds the weekday', () => {
    expect(formatDateWeekday('2026-10-27')).toBe('Tuesday, Oct 27, 2026');
  });

  it('returns the raw value when invalid, a dash when missing', () => {
    expect(formatDateWeekday('garbage')).toBe('garbage');
    expect(formatDateWeekday(undefined)).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('includes the time', () => {
    const out = formatDateTime(new Date(2026, 9, 27, 16, 5).toISOString());
    expect(out).toContain('Oct 27, 2026');
    expect(out).toMatch(/4:05\s?PM/);
  });

  it('handles missing and invalid input', () => {
    expect(formatDateTime(undefined)).toBe('—');
    expect(formatDateTime('garbage')).toBe('garbage');
  });
});
