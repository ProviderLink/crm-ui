import { useMemo, useState } from 'react';

import type { IScorecard } from '@/types/scorecard';

/**
 * Narrows scorecards by week and by a search over VA and company name. The
 * week follows the latest one until the user picks another (or "all").
 */
export function useScorecardView(
  scorecards: IScorecard[],
  nameOf: (s: IScorecard) => string
) {
  const [search, setSearch] = useState('');
  // null = follow the latest week; 'all' = every week.
  const [weekChoice, setWeekChoice] = useState<string | null>(null);

  // Distinct weeks, newest first, keyed by their start date.
  const weeks = useMemo(() => {
    const map = new Map<string, IScorecard>();
    for (const s of scorecards) {
      const key = s.weekStart?.slice(0, 10);
      if (key && !map.has(key)) map.set(key, s);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [scorecards]);
  const week = weekChoice ?? weeks[0]?.[0] ?? 'all';

  const query = search.trim().toLowerCase();
  const rows = scorecards.filter(s => {
    if (week !== 'all' && s.weekStart?.slice(0, 10) !== week) return false;
    if (!query) return true;
    return `${nameOf(s)} ${s.companyName ?? ''}`.toLowerCase().includes(query);
  });

  return { search, setSearch, weeks, week, setWeekChoice, rows };
}
