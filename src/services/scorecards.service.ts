import api, { LONG_REQUEST_TIMEOUT_MS } from '@/lib/api';
import { LIST_LIMIT, toQueryString } from '@/lib/api-query';
import type { IScorecard } from '@/types/scorecard';

export async function getScorecards(vaId?: string): Promise<IScorecard[]> {
  // A large page, so every scorecard comes back with its VA name.
  const { data } = await api.get<{ data: IScorecard[] }>(
    `/crm/scorecards?${toQueryString({ vaId, limit: LIST_LIMIT })}`
  );
  return data.data;
}

export async function generateScorecards(
  vaId?: string
): Promise<{ generated: number }> {
  const payload: Record<string, unknown> = {};
  if (vaId) payload.vaId = vaId;
  const { data } = await api.post<{ data: { generated: number } }>(
    '/crm/scorecards/generate',
    payload,
    { timeout: LONG_REQUEST_TIMEOUT_MS }
  );
  return data.data;
}
