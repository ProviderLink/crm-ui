import api from '@/lib/api'

export interface IDashboardStats {
  activeAssignmentsCount: number
  totalEntriesToday: number
  eodSubmissionsToday: number
  missingEodsToday: number
  missingEodAssignments: Array<{ id: string; vaId: string; clientId: string }>
  perVABreakdown: Record<string, number>
  perClientBreakdown: Record<string, number>
}

export async function getDashboardStats(): Promise<IDashboardStats> {
  const { data } = await api.get<{ data: IDashboardStats }>(
    '/admin/dashboard-stats'
  )
  return data.data
}
