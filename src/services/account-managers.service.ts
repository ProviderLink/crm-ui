import api from '@/lib/api';

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
  const { data } = await api.get<{ data: any[] }>(
    `/shared/users?${params.toString()}`
  );
  return data.data.map((u: any) => ({ ...u, id: u._id ?? u.id }));
}

export async function getCrmUsersByRole(
  role: 'va' | 'client' | 'account_manager' | 'admin'
): Promise<ICrmUser[]> {
  const { data } = await api.get<{ data: any[] }>(`/shared/users?role=${role}`);
  return data.data.map((u: any) => ({ ...u, id: u._id ?? u.id }));
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
    data: { clients: any[]; vas: any[] };
  }>(`/shared/users/crm-accounts`);
  const map = (u: any) => ({ ...u, id: u._id ?? u.id }) as ICrmUser;
  return {
    clients: data.data.clients.map(map),
    vas: data.data.vas.map(map),
  };
}
