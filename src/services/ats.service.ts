import api from '@/lib/api';
import type { IAtsCandidate, IAtsClient, IAtsUser } from '@/types/ats';

export async function getAtsClients(): Promise<IAtsClient[]> {
  const { data } = await api.get<{ data: IAtsClient[] }>('/ats/clients');
  return data.data;
}

/** Candidates = VAs in CRM context. */
export async function getAtsVAs(): Promise<IAtsCandidate[]> {
  const { data } = await api.get<{ data: IAtsCandidate[] }>('/ats/candidates');
  return data.data;
}

/** Team members = users with ATS or admin roles. */
export async function getAtsTeam(): Promise<IAtsUser[]> {
  const { data } = await api.get<{ data: IAtsUser[] }>('/shared/users');
  return data.data;
}
