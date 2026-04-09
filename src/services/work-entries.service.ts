import api from '@/lib/api'
import type {
  CreateWorkEntryPayload,
  IWorkEntry,
  UpdateWorkEntryPayload,
} from '@/types/work-entry'

interface WorkEntriesQuery {
  assignmentId?: string
  dateFrom?: string
  dateTo?: string
}

export async function getWorkEntries(
  query: WorkEntriesQuery = {}
): Promise<IWorkEntry[]> {
  const params = new URLSearchParams()
  if (query.assignmentId) params.set('assignmentId', query.assignmentId)
  if (query.dateFrom) params.set('dateFrom', query.dateFrom)
  if (query.dateTo) params.set('dateTo', query.dateTo)
  const { data } = await api.get<{ data: IWorkEntry[] }>(
    `/work-entries?${params.toString()}`
  )
  return data.data
}

export async function createWorkEntry(
  payload: CreateWorkEntryPayload
): Promise<IWorkEntry> {
  const { data } = await api.post<{ data: IWorkEntry }>(
    '/work-entries',
    payload
  )
  return data.data
}

export async function updateWorkEntry(
  id: string,
  payload: UpdateWorkEntryPayload
): Promise<IWorkEntry> {
  const { data } = await api.patch<{ data: IWorkEntry }>(
    `/work-entries/${id}`,
    payload
  )
  return data.data
}

export async function deleteWorkEntry(id: string): Promise<void> {
  await api.delete(`/work-entries/${id}`)
}
