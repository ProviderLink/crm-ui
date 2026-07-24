import api from '@/lib/api';
import type { IAtsCandidate, IAtsClient, IAtsUser } from '@/types/ats';

export async function getAtsClients(): Promise<IAtsClient[]> {
  const { data } = await api.get<{ data: any[] }>('/ats/clients', {
    params: { limit: 1000 },
  });
  return data.data.map((c: any) => ({ ...c, id: c._id ?? c.id }));
}

/** Candidates = VAs in CRM context. */
export async function getAtsVAs(): Promise<IAtsCandidate[]> {
  // Backend defaults to limit=20 when omitted, which truncates the VA name map
  // and causes assigned VAs to render as raw ids. Fetch a large page.
  const { data } = await api.get<{ data: any[] }>('/ats/candidates', {
    params: { limit: 1000 },
  });
  return data.data.map((v: any) => ({ ...v, id: v._id ?? v.id }));
}

/** Team members = users with ATS or admin roles. */
export async function getAtsTeam(): Promise<IAtsUser[]> {
  const { data } = await api.get<{ data: any[] }>('/shared/users');
  return data.data.map((u: any) => ({ ...u, id: u._id ?? u.id }));
}
