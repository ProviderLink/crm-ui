import { describe, expect, it } from 'vitest';

import type { ISurveyReminder } from '@/types/survey-reminder';

import { dueKey, isOpen } from './survey';

const reminder = (over: Partial<ISurveyReminder>): ISurveyReminder => ({
  _id: 'r1',
  relatedType: 'va',
  relatedId: 'v1',
  surveyType: '3_day',
  dueDate: '2026-11-03T00:00:00.000Z',
  status: 'pending',
  createdAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

describe('isOpen', () => {
  it('is true while pending or sent', () => {
    expect(isOpen(reminder({ status: 'pending' }))).toBe(true);
    expect(isOpen(reminder({ status: 'sent' }))).toBe(true);
  });

  it('is false once completed or skipped', () => {
    expect(isOpen(reminder({ status: 'completed' }))).toBe(false);
    expect(isOpen(reminder({ status: 'skipped' }))).toBe(false);
  });
});

describe('dueKey', () => {
  it('is the date part of the due date', () => {
    expect(dueKey(reminder({}))).toBe('2026-11-03');
  });

  it('is empty without a due date', () => {
    expect(dueKey(reminder({ dueDate: '' }))).toBe('');
  });
});
