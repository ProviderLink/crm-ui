import api from '@/lib/api'
import type { IUser, UserRole } from '@/types/auth'

interface LoginPayload {
  email: string
  password: string
}

interface BackendUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

export interface LoginResponse {
  user: IUser
  accessToken: string
}

function mapUser(u: BackendUser): IUser {
  return { id: u.id, email: u.email, name: `${u.firstName} ${u.lastName}`, role: u.role }
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<{ data: { accessToken: string; user: BackendUser } }>('/auth/login', payload)
  return { user: mapUser(data.data.user), accessToken: data.data.accessToken }
}

export async function getMe(): Promise<IUser> {
  const { data } = await api.get<{ data: BackendUser }>('/auth/me')
  return mapUser(data.data)
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password })
}
