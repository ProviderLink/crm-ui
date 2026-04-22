import api from '@/lib/api'

export interface IAccountManager {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'account_manager'
  isActive: boolean
  phone?: string
  atsId?: string
  lastLogin?: string
  createdAt?: string
}

export interface CreateAccountManagerPayload {
  email: string
  firstName: string
  lastName: string
  role: 'account_manager'
  phone?: string
  atsId?: string
}

export interface UpdateAccountManagerPayload {
  firstName?: string
  lastName?: string
  phone?: string
  isActive?: boolean
  atsId?: string
}

export async function getAccountManagers(activeOnly = false): Promise<IAccountManager[]> {
  const params = new URLSearchParams({ role: 'account_manager' })
  if (activeOnly) params.set('active', 'true')
  const { data } = await api.get<{ data: IAccountManager[] }>(
    `/users?${params.toString()}`
  )
  return data.data
}

export async function createAccountManager(
  payload: CreateAccountManagerPayload
): Promise<IAccountManager> {
  const { data } = await api.post<{ data: IAccountManager }>('/users', payload)
  return data.data
}

export async function updateAccountManager(
  id: string,
  payload: UpdateAccountManagerPayload
): Promise<IAccountManager> {
  const { data } = await api.patch<{ data: IAccountManager }>(
    `/users/${id}`,
    payload
  )
  return data.data
}

export async function deactivateAccountManager(id: string): Promise<void> {
  await api.delete(`/users/${id}`)
}

export async function resetAccountManagerPassword(id: string): Promise<void> {
  await api.post(`/users/${id}/reset-password`)
}
