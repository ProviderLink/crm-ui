import api from '@/lib/api'
import type { IScorecard } from '@/types/scorecard'

export async function getScorecards(vaId?: string): Promise<IScorecard[]> {
  const params = vaId ? `?vaId=${vaId}` : ''
  const { data } = await api.get<{ data: IScorecard[] }>(`/scorecards${params}`)
  return data.data
}

export async function generateScorecards(): Promise<void> {
  await api.post('/scorecards/generate')
}
