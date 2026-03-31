import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/hooks/store'

export function ProtectedRoute() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
