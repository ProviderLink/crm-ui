import api from '@/lib/api';
import type { IUser, UserRole } from '@/types/auth';

interface LoginPayload {
  email: string;
  password: string;
}

interface BackendUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  atsId?: string;
  companyName?: string;
}

export interface LoginResponse {
  user: IUser;
  accessToken: string;
}

function mapUser(u: BackendUser): IUser {
  return {
    id: u.id,
    email: u.email,
    name: `${u.firstName} ${u.lastName}`,
    role: u.role,
    atsId: u.atsId,
    companyName: u.companyName,
  };
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<{
    data: { accessToken: string; user: BackendUser };
  }>('/auth/login', payload);
  return { user: mapUser(data.data.user), accessToken: data.data.accessToken };
}

/** Called once on startup — uses the HttpOnly refresh cookie to get a fresh token, then fetches the user. */
export async function hydrate(): Promise<LoginResponse> {
  const { data: refreshData } = await api.post<{
    data: { accessToken: string };
  }>('/auth/refresh');
  const accessToken = refreshData.data.accessToken;

  // Pass the new token explicitly since it's not yet in the Redux store
  const { data: meData } = await api.get<{ data: BackendUser }>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return { user: mapUser(meData.data), accessToken };
}

export async function getMe(): Promise<IUser> {
  const { data } = await api.get<{ data: BackendUser }>('/auth/me');
  return mapUser(data.data);
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout').catch(() => {
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

export async function acceptInvitation(
  token: string,
  password: string
): Promise<void> {
  await api.post('/auth/accept-invitation', { token, password });
}
