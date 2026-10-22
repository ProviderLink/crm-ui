import api from '@/lib/api';
import type { IUser, UserRole } from '@/types/auth';

interface LoginPayload {
  email: string;
  password: string;
}

/** Shape returned by ats-crm-backend /auth/* endpoints */
interface BackendUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  clientRef?: string | null;
}

export interface LoginResponse {
  user: IUser;
  accessToken: string;
}

const CRM_ROLES: readonly UserRole[] = [
  'admin',
  'account_manager',
  'va',
  'client',
];

/** The signed-in account has no role that can use the CRM. */
export class NoCrmAccessError extends Error {
  constructor() {
    super('This account does not have access to the CRM.');
    this.name = 'NoCrmAccessError';
  }
}

function mapUser(u: BackendUser): IUser {
  // Pick the first CRM role: a user may also hold ATS-only roles, and an
  // unknown role must never fall through to the VA portal.
  const role = (u.roles ?? []).find((r): r is UserRole =>
    CRM_ROLES.includes(r)
  );
  if (!role) throw new NoCrmAccessError();
  return {
    id: u._id,
    email: u.email,
    name: `${u.firstName} ${u.lastName}`,
    role,
    clientRef: u.clientRef ?? null,
  };
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<{
    data: { accessToken: string; user: BackendUser };
  }>('/auth/login', { ...payload, app: 'crm' });
  const user = mapUser(data.data.user);
  return { user, accessToken: data.data.accessToken };
}

/**
 * Called once on startup — uses the HttpOnly refreshTokenCrm cookie
 * to obtain a fresh access token AND the user profile in a single call.
 */
export async function hydrate(): Promise<LoginResponse> {
  const { data } = await api.post<{
    data: { accessToken: string; user: BackendUser };
  }>('/auth/refresh-token', { app: 'crm' });
  return { user: mapUser(data.data.user), accessToken: data.data.accessToken };
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout', { app: 'crm' }).catch(() => {
    // best-effort — clear client state regardless
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(
  token: string,
  password: string
): Promise<void> {
  await api.post('/auth/reset-password', { token, password });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}

/** Accept invitation → set initial password (maps to /auth/set-password). */
export async function acceptInvitation(
  token: string,
  password: string
): Promise<void> {
  await api.post('/auth/set-password', { token, password });
}
