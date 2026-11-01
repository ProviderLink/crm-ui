import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { IScorecard } from '@/types/scorecard';

import { scoreColor } from './score';
import { useScorecardView } from './use-scorecard-view';

const card = (over: Partial<IScorecard>): IScorecard => ({
  id: 'sc',
  vaId: 'v1',
  assignmentId: 'a1',
  vaName: 'Ayesha Rahman',
  companyName: 'Sunrise Clinic',
  weekStart: '2026-10-26',
  weekEnd: '2026-11-01',
  totalHours: 30,
  totalTasksCompleted: 10,
  avgTasksPerDay: 2,
  eodComplianceRate: 80,
  onTimeSubmissionRate: 90,
  productivityScore: 70,
  categoryDistribution: {},
  generatedAt: '2026-11-01T00:00:00.000Z',
  ...over,
});

const cards = [
  card({ id: '1', vaName: 'Ayesha Rahman', weekStart: '2026-10-26' }),
  card({ id: '2', vaName: 'Tomas Novak', weekStart: '2026-10-26' }),
  card({ id: '3', vaName: 'Ayesha Rahman', weekStart: '2026-10-19' }),
];
const nameOf = (s: IScorecard) => s.vaName ?? 'Unknown VA';

describe('useScorecardView', () => {
  it('lists the weeks, newest first, and follows the latest', () => {
    const { result } = renderHook(() => useScorecardView(cards, nameOf));
    expect(result.current.weeks.map(([key]) => key)).toEqual([
      '2026-10-26',
      '2026-10-19',
    ]);
    expect(result.current.week).toBe('2026-10-26');
    expect(result.current.rows.map(r => r.id)).toEqual(['1', '2']);
  });

  it('shows every week when asked', () => {
    const { result } = renderHook(() => useScorecardView(cards, nameOf));
    act(() => result.current.setWeekChoice('all'));
    expect(result.current.rows).toHaveLength(3);
  });

  it('shows another week when picked', () => {
    const { result } = renderHook(() => useScorecardView(cards, nameOf));
    act(() => result.current.setWeekChoice('2026-10-19'));
    expect(result.current.rows.map(r => r.id)).toEqual(['3']);
  });

  it('searches the VA and the company, ignoring case and spaces', () => {
    const { result } = renderHook(() => useScorecardView(cards, nameOf));
    act(() => result.current.setSearch('  TOMAS '));
    expect(result.current.rows.map(r => r.id)).toEqual(['2']);
    act(() => result.current.setSearch('sunrise'));
    expect(result.current.rows.map(r => r.id)).toEqual(['1', '2']);
  });

  it('is empty, on the "all" week, with no scorecards', () => {
    const { result } = renderHook(() => useScorecardView([], nameOf));
    expect(result.current.week).toBe('all');
    expect(result.current.rows).toEqual([]);
  });
});

describe('scoreColor', () => {
  it('has three levels', () => {
    expect(scoreColor(95)).toBe('text-status-success');
    expect(scoreColor(80)).toBe('text-status-success');
    expect(scoreColor(79)).toBe('text-status-warning');
    expect(scoreColor(60)).toBe('text-status-warning');
    expect(scoreColor(59)).toBe('text-status-error');
  });
});
