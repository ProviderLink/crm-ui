import api from '@/lib/api'
import type { IVaProfile, UpdateVaProfilePayload } from '@/types/va-profile'

export async function getVaProfiles(): Promise<IVaProfile[]> {
  const { data } = await api.get<{ data: IVaProfile[] }>('/va-profiles')
  return data.data
}

export async function updateVaProfile(
  id: string,
  payload: UpdateVaProfilePayload
): Promise<IVaProfile> {
  const { data } = await api.patch<{ data: IVaProfile }>(
    `/va-profiles/${id}`,
    payload
  )
  return data.data
}
