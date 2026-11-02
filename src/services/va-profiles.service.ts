import api from '@/lib/api';
import { LIST_LIMIT, toQueryString } from '@/lib/api-query';
import { withId, type ApiDoc } from '@/lib/with-id';
import type { IAssignment } from '@/types/assignment';
import type {
  IVaAssignment,
  IVaProfile,
  UpdateVaProfilePayload,
} from '@/types/va-profile';

export async function getVaProfiles(): Promise<IVaProfile[]> {
  // Backend defaults to limit=20 when omitted, which silently truncates the list;
  // fetch a large page so every row is returned.
  const { data } = await api.get<{ data: ApiDoc<IVaProfile>[] }>(
    `/crm/va-profiles?${toQueryString({ limit: LIST_LIMIT })}`
  );
  return data.data.map(v => withId<IVaProfile>(v));
}

/** One VA's profile (the API creates an empty one on first read). */
export async function getVaProfile(vaId: string): Promise<IVaProfile> {
  const { data } = await api.get<{ data: ApiDoc<IVaProfile> }>(
    `/crm/va-profiles/${vaId}`
  );
  return withId<IVaProfile>(data.data);
}

export async function updateVaProfile(
  id: string,
  payload: UpdateVaProfilePayload
): Promise<IVaProfile> {
  const { data } = await api.patch<{ data: IVaProfile }>(
    `/crm/va-profiles/${id}`,
    payload
  );
  return data.data;
}

export async function getVaAssignments(
  candidateId: string
): Promise<IVaAssignment[]> {
  const { data } = await api.get<{ data: IAssignment[] }>(
    `/crm/assignments?${toQueryString({ candidateId, limit: LIST_LIMIT })}`
  );
  return (data.data ?? []).map(a => ({
    _id: a._id,
    clientId: a.clientId,
    companyName: a.companyName ?? '',
    status: a.status,
    serviceType: a.serviceType ?? '',
    startDate: a.startDate,
    endDate: a.endDate ?? null,
    notes: a.notes ?? null,
  }));
}
