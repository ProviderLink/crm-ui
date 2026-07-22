import api from '@/lib/api';

export interface IAccountManager {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'account_manager';
  isActive: boolean;
  phone?: string;
  atsId?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface ICrmUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'va' | 'client' | 'account_manager' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  phone?: string;
  atsId?: string;
  lastLogin?: string;
  createdAt?: string;
}

// ── Read-only (users are provisioned in ATS) ──────────────────────────────────

export async function getAccountManagers(
  activeOnly = false
): Promise<IAccountManager[]> {
  const params = new URLSearchParams({ role: 'account_manager' });
  if (activeOnly) params.set('active', 'true');
  const { data } = await api.get<{ data: IAccountManager[] }>(
    `/shared/users?${params.toString()}`
  );
  return data.data;
}

export async function getCrmUsersByRole(
  role: 'va' | 'client' | 'account_manager' | 'admin'
): Promise<ICrmUser[]> {
  const { data } = await api.get<{ data: ICrmUser[] }>(
    `/shared/users?role=${role}`
  );
  return data.data;
}
