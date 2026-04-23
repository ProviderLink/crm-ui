export type UserRole = 'admin' | 'account_manager' | 'va' | 'client'

export interface IUser {
  id: string
  email: string
  name: string
  role: UserRole
  atsId?: string
  companyName?: string
}

export interface AuthState {
  user: IUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isHydrated: boolean
}
