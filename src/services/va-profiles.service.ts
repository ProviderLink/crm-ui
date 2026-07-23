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

export interface IVaAssignment {
  _id: string;
  clientId: string;
  companyName: string;
  status: 'active' | 'on_hold' | 'ended';
  serviceType: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
}

export async function getVaAssignments(
  candidateId: string
): Promise<IVaAssignment[]> {
  const { data } = await api.get<{ data: any[] }>(
    `/crm/assignments?candidateId=${candidateId}&limit=100`
  );
  return (data.data ?? []).map((a: any) => ({
    _id: a._id,
    clientId: a.clientId,
    companyName: a.companyName ?? '',
    status: a.status,
    serviceType: a.serviceType,
    startDate: a.startDate,
    endDate: a.endDate ?? null,
    notes: a.notes ?? null,
  }));
}
