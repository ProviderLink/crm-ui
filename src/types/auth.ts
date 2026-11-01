export type UserRole = 'admin' | 'account_manager' | 'va' | 'client';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clientRef?: string | null;
}

export interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  account_manager: 'Account Manager',
  va: 'Virtual Assistant',
  client: 'Client',
};
