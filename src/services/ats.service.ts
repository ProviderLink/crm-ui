import api from '@/lib/api';
import { withId, type ApiDoc } from '@/lib/with-id';
import type { IAtsCandidate, IAtsClient } from '@/types/ats';
import axios from 'axios';

interface AssignmentLookup {
  candidateId: string;
  candidateName?: string;
  clientId: string;
  companyName?: string;
}

/**
 * Account managers have no ATS access, so the ATS lists answer 403 for them.
 * Fall back to the VAs and clients on their own assignments.
 */
async function fromOwnAssignments(): Promise<AssignmentLookup[]> {
  const { data } = await api.get<{ data: AssignmentLookup[] }>(
    '/crm/assignments',
    { params: { limit: 1000 } }
  );
  return data.data;
}

const isForbidden = (e: unknown) =>
  axios.isAxiosError(e) && e.response?.status === 403;

export async function getAtsClients(): Promise<IAtsClient[]> {
  try {
    const { data } = await api.get<{ data: ApiDoc<IAtsClient>[] }>('/ats/clients', {
      params: { limit: 1000 },
    });
    return data.data.map(c => withId<IAtsClient>(c));
  } catch (e) {
    if (!isForbidden(e)) throw e;
    const byId = new Map<string, IAtsClient>();
    for (const a of await fromOwnAssignments()) {
      byId.set(a.clientId, {
        id: a.clientId,
        companyName: a.companyName ?? '',
        status: 'active',
      });
    }
    return [...byId.values()];
  }
}

/** Candidates = VAs in CRM context. */
export async function getAtsVAs(): Promise<IAtsCandidate[]> {
  // Backend defaults to limit=20 when omitted, which truncates the VA name map
  // and causes assigned VAs to render as raw ids. Fetch a large page.
  try {
    const { data } = await api.get<{ data: ApiDoc<IAtsCandidate>[] }>('/ats/candidates', {
      params: { limit: 1000 },
    });
    return data.data.map(v => withId<IAtsCandidate>(v));
  } catch (e) {
    if (!isForbidden(e)) throw e;
    const byId = new Map<string, IAtsCandidate>();
    for (const a of await fromOwnAssignments()) {
      const [firstName = '', ...rest] = (a.candidateName ?? '').split(' ');
      byId.set(a.candidateId, {
        id: a.candidateId,
        firstName,
        lastName: rest.join(' '),
        status: 'hired',
      });
    }
    return [...byId.values()];
  }
}
