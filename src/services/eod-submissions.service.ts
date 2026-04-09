import api from '@/lib/api'
import type { CreateEodPayload, IEodSubmission } from '@/types/eod-submission'

interface EodQuery {
  assignmentId?: string
  dateFrom?: string
  dateTo?: string
}

export async function getEodSubmissions(
  query: EodQuery = {}
): Promise<IEodSubmission[]> {
  const params = new URLSearchParams()
  if (query.assignmentId) params.set('assignmentId', query.assignmentId)
  if (query.dateFrom) params.set('dateFrom', query.dateFrom)
  if (query.dateTo) params.set('dateTo', query.dateTo)
  const { data } = await api.get<{ data: IEodSubmission[] }>(
    `/eod-submissions?${params.toString()}`
  )
  return data.data
}

export async function createEodSubmission(
  payload: CreateEodPayload
): Promise<IEodSubmission> {
  const { data } = await api.post<{ data: IEodSubmission }>(
    '/eod-submissions',
    payload
  )
  return data.data
}
