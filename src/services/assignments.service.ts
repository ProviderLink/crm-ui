import api from '@/lib/api'
import type { IAssignment } from '@/types/assignment'

export async function getMyAssignments(): Promise<IAssignment[]> {
  const { data } = await api.get<{ data: IAssignment[] }>('/assignments?status=active')
  return data.data
}
