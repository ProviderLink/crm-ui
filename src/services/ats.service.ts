import api from '@/lib/api'
import type { IAtsCandidate, IAtsClient, IAtsUser } from '@/types/ats'

export async function getAtsClients(): Promise<IAtsClient[]> {
  const { data } = await api.get<{ data: IAtsClient[] }>('/ats/clients')
  return data.data
}

export async function getAtsVAs(): Promise<IAtsCandidate[]> {
  const { data } = await api.get<{ data: IAtsCandidate[] }>('/ats/vas')
  return data.data
}

export async function getAtsTeam(): Promise<IAtsUser[]> {
  const { data } = await api.get<{ data: IAtsUser[] }>('/ats/team')
  return data.data
}
