import api from '@/lib/api'
import type { IUser } from '@/types/auth'

interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  user: IUser
  accessToken: string
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  return data
}

export async function getMe(): Promise<IUser> {
  const { data } = await api.get<{ user: IUser }>('/auth/me')
  return data.user
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password })
}
