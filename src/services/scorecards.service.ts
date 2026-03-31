import api from '@/lib/api'
import type { IScorecard } from '@/types/scorecard'

export async function getScorecards(): Promise<IScorecard[]> {
  const { data } = await api.get<{ data: IScorecard[] }>('/scorecards')
  return data.data
}
