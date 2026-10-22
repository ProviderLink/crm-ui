import { useAppSelector } from '@/hooks/store'
import { roleHome } from '@/lib/role-home'
import type { UserRole } from '@/types/auth'
import { Navigate, Outlet } from 'react-router-dom'

interface Props {
  roles: UserRole[]
}

export function RoleGuard({ roles }: Props) {
  const user = useAppSelector(s => s.auth.user)
  if (!user) return <Navigate to="/login" replace />
  // Wrong portal: send them to their own home, not the login form.
  if (!roles.includes(user.role))
    return <Navigate to={roleHome[user.role] ?? '/login'} replace />
  return <Outlet />
}
