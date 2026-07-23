import api from '@/lib/api';
import type { IScorecard } from '@/types/scorecard';

export async function getScorecards(vaId?: string): Promise<IScorecard[]> {
  const params = new URLSearchParams();
  if (vaId) params.set('vaId', vaId);
  const { data } = await api.get<{ data: IScorecard[] }>(
    `/crm/scorecards?${params.toString()}`
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
    payload
  );
  return data.data;
}
