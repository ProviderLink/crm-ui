import { useCallback, useMemo } from 'react';

import { buildScorecardColumns } from '@/features/scorecards/scorecard-columns';
import { useScorecardGenerate } from '@/features/scorecards/use-scorecard-generate';
import { useScorecardView } from '@/features/scorecards/use-scorecard-view';
import { useAllAssignmentsQuery, useScorecardsQuery } from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import type { IScorecard } from '@/types/scorecard';

/**
 * The manager's weekly scorecards. The backend already limits them to this
 * manager's own VAs; names fall back to the manager's assignments.
 */
export function useAmScorecards() {
  const user = useAppSelector(s => s.auth.user);
  const {
    data: scorecards = [],
    isLoading,
    isError,
    error,
  } = useScorecardsQuery();
  const { data: assignments = [] } = useAllAssignmentsQuery(user?.id);

  const vaMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of assignments)
      if (a.candidateName) m[a.candidateId] = a.candidateName;
    return m;
  }, [assignments]);
  const nameOf = useCallback(
    (s: IScorecard) => s.vaName || vaMap[s.vaId] || 'Unknown VA',
    [vaMap]
  );
  const columns = useMemo(() => buildScorecardColumns(nameOf), [nameOf]);

  const view = useScorecardView(scorecards, nameOf);
  const generate = useScorecardGenerate();

  const { rows } = view;
  const average = (pick: (s: IScorecard) => number) =>
    rows.length === 0
      ? null
      : rows.reduce((sum, s) => sum + pick(s), 0) / rows.length;
  const lowest = rows.reduce<IScorecard | null>(
    (low, s) => (!low || s.productivityScore < low.productivityScore ? s : low),
    null
  );

  return {
    ...view,
    isLoading,
    isError,
    error,
    nameOf,
    columns,
    avgScore: average(s => s.productivityScore),
    avgEod: average(s => s.eodComplianceRate),
    lowest,
    generate,
  };
}
