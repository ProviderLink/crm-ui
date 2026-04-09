import { useAppSelector } from '@/hooks/store'
import type { UserRole } from '@/types/auth'
import { Navigate, Outlet } from 'react-router-dom'

interface Props {
  roles: UserRole[]
}

export function RoleGuard({ roles }: Props) {
  const user = useAppSelector(s => s.auth.user)
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/login" replace />
  return <Outlet />
}
