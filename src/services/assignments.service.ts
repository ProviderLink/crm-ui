import api from '@/lib/api'
import type { IAssignment, CreateAssignmentPayload, UpdateAssignmentPayload } from '@/types/assignment'

// VA — own active assignments only
export async function getMyAssignments(): Promise<IAssignment[]> {
  const { data } = await api.get<{ data: IAssignment[] }>('/assignments?status=active')
  return data.data
}

// Admin/AM — all assignments with optional status filter
export async function getAllAssignments(query: { status?: string } = {}): Promise<IAssignment[]> {
  const params = new URLSearchParams()
  if (query.status) params.set('status', query.status)
  const { data } = await api.get<{ data: IAssignment[] }>(`/assignments?${params.toString()}`)
  return data.data
}

export async function createAssignment(payload: CreateAssignmentPayload): Promise<IAssignment> {
  const { data } = await api.post<{ data: IAssignment }>('/assignments', payload)
  return data.data
}

export async function updateAssignment(
  id: string,
  payload: UpdateAssignmentPayload,
): Promise<IAssignment> {
  const { data } = await api.patch<{ data: IAssignment }>(`/assignments/${id}`, payload)
  return data.data
}

export async function deleteAssignment(id: string): Promise<void> {
  await api.delete(`/assignments/${id}`)
}
