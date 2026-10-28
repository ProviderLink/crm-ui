import api from '@/lib/api';
import { withId, type ApiDoc } from '@/lib/with-id';

export interface IAccountManager {
  id: string;
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  phone?: string;
  atsId?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface ICrmUser {
  id: string;
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  emailVerified: boolean;
  phone?: string;
  atsId?: string;
  clientRef?: string | null;
  candidateRef?: string | null;
  isInviteAccepted?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

// ── Read-only (users are provisioned in ATS) ──────────────────────────────────

export async function getAccountManagers(
  activeOnly = false
): Promise<IAccountManager[]> {
  const params = new URLSearchParams({ role: 'account_manager' });
  if (activeOnly) params.set('isActive', 'true');
  const { data } = await api.get<{ data: ApiDoc<IAccountManager>[] }>(
    `/shared/users?${params.toString()}`
  );
  return data.data.map(u => withId<IAccountManager>(u));
}

export async function getCrmUsersByRole(
  role: 'va' | 'client' | 'account_manager' | 'admin'
): Promise<ICrmUser[]> {
  // VAs and clients come from the self-scoped endpoint: /shared/users needs
  // team.read, which account managers lack, so it answered 403 for them.
  if (role === 'va' || role === 'client') {
    const { vas, clients } = await getCrmAccountsList();
    return role === 'va' ? vas : clients;
  }
  const { data } = await api.get<{ data: ApiDoc<ICrmUser>[] }>(
    `/shared/users?role=${role}`
  );
  return data.data.map(u => withId<ICrmUser>(u));
}

/**
 * Self-scoped CRM accounts endpoint. Returns CRM client users and VA users
 * scoped to the caller — admins get everyone, account managers get only
 * clients/VAs linked to their own assignments. Requires only authentication
 * (no team.read permission), so account managers can populate the Accounts
 * page even when they aren't granted team.read.
 */
export async function getCrmAccountsList(): Promise<{
  clients: ICrmUser[];
  vas: ICrmUser[];
}> {
  const { data } = await api.get<{
    data: { clients: ApiDoc<ICrmUser>[]; vas: ApiDoc<ICrmUser>[] };
  }>(`/shared/users/crm-accounts`);
  return {
    clients: data.data.clients.map(u => withId<ICrmUser>(u)),
    vas: data.data.vas.map(u => withId<ICrmUser>(u)),
  };
}
