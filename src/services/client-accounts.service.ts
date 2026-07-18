import type {
  IClientAccount,
  UpdateClientAccountPayload,
} from '@/types/client-account';

/**
 * TODO: ats-crm-backend does not have a standalone /client-accounts resource.
 * Client CRM profiles are stored as a sub-resource on ATS clients
 * (PATCH /ats/clients/:id/crm-profile). Wire this up once the
 * AccountManagementPage is adapted to the new data model.
 */

export async function getClientAccounts(): Promise<IClientAccount[]> {
  return [];
}

export async function updateClientAccount(
  _id: string,
  _payload: UpdateClientAccountPayload
): Promise<IClientAccount> {
  throw new Error('Not implemented — use PATCH /ats/clients/:id/crm-profile');
}
