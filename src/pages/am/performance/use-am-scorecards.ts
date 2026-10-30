import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { useAllAssignmentsQuery, useScorecardsQuery } from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { generateScorecards } from '@/services/scorecards.service';
import type { IScorecard } from '@/types/scorecard';

/**
 * The manager's weekly scorecards. The backend already limits them to this
 * manager's own VAs; names fall back to the manager's assignments.
 */
export function useAmScorecards() {
  const queryClient = useQueryClient();
  const user = useAppSelector(s => s.auth.user);
  const { data: scorecards = [], isLoading } = useScorecardsQuery();
  const { data: assignments = [] } = useAllAssignmentsQuery(user?.id);

  const vaMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of assignments)
      if (a.candidateName) m[a.candidateId] = a.candidateName;
    return m;
  }, [assignments]);
  const nameOf = (s: IScorecard) => s.vaName || vaMap[s.vaId] || 'Unknown VA';

  const [search, setSearch] = useState('');
  // null = follow the latest week; 'all' = every week.
  const [weekChoice, setWeekChoice] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const average = (pick: (s: IScorecard) => number) =>
    rows.length === 0
      ? null
      : rows.reduce((sum, s) => sum + pick(s), 0) / rows.length;
  const lowest = rows.reduce<IScorecard | null>(
    (low, s) => (!low || s.productivityScore < low.productivityScore ? s : low),
    null
  );

  async function handleGenerate() {
    setGenerateError(null);
    setConfirmOpen(false);
    setGenerating(true);
    try {
      await generateScorecards();
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
    } catch {
      setGenerateError('Failed to generate scorecards. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  return {
    rows,
    weeks,
    week,
    setWeekChoice,
    search,
    setSearch,
    isLoading,
    nameOf,
    avgScore: average(s => s.productivityScore),
    avgEod: average(s => s.eodComplianceRate),
    lowest,
    generating,
    generateError,
    confirmOpen,
    setConfirmOpen,
    handleGenerate,
  };
}
