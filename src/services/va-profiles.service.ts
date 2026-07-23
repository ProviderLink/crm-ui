import api from '@/lib/api';
import type { IVaProfile, UpdateVaProfilePayload } from '@/types/va-profile';

export async function getVaProfiles(): Promise<IVaProfile[]> {
  const { data } = await api.get<{ data: any[] }>('/crm/va-profiles');
  return data.data.map((v: any) => ({ ...v, id: v._id ?? v.id }));
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
