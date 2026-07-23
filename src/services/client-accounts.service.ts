import api from '@/lib/api';
import type {
  IClientAccount,
  UpdateClientAccountPayload,
} from '@/types/client-account';

export async function getProvisionedClients(): Promise<
  { clientId: string; companyName: string }[]
> {
  const { data } = await api.get<{
    data: { clientId: string; companyName: string }[];
  }>('/crm/client-accounts/provisioned');
  return data.data;
}

export async function getClientAccounts(): Promise<IClientAccount[]> {
  const { data } = await api.get<{ data: any[] }>('/crm/client-accounts');
  return data.data.map((c: any) => ({ ...c, id: c._id ?? c.id }));
}

export async function getHiredVasForClient(
  clientId: string
): Promise<{ id: string; firstName: string; lastName: string }[]> {
  const { data } = await api.get<{
    data: { id: string; firstName: string; lastName: string }[];
  }>(`/crm/client-accounts/${clientId}/hired-vas`);
  return data.data;
}

export async function updateClientAccount(
  id: string,
  payload: UpdateClientAccountPayload
): Promise<IClientAccount> {
  const { data } = await api.patch<{ data: IClientAccount }>(
    `/crm/client-accounts/${id}`,
    payload
  );
  return data.data;
}
