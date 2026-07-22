import api from '@/lib/api';
import type {
  IClientAccount,
  UpdateClientAccountPayload,
} from '@/types/client-account';

export async function getClientAccounts(): Promise<IClientAccount[]> {
  const { data } = await api.get<{ data: IClientAccount[] }>(
    '/crm/client-accounts'
  );
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
