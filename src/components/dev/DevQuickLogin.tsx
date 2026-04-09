import { useAppDispatch } from '@/hooks/store'
import { login } from '@/services/auth.service'
import { setAuth } from '@/store/slices/authSlice'
import type { UserRole } from '@/types/auth'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const roleRedirect: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  account_manager: '/admin/dashboard',
  va: '/va/dashboard',
  client: '/client/dashboard',
}

interface DevAccount {
  label: string
  email: string
  password: string
}

const DEV_ACCOUNTS: DevAccount[] = [
  {
    label: 'VA',
    email: import.meta.env.VITE_DEV_VA_EMAIL ?? '',
    password: import.meta.env.VITE_DEV_VA_PASSWORD ?? '',
  },
  {
    label: 'Admin',
    email: import.meta.env.VITE_DEV_ADMIN_EMAIL ?? '',
    password: import.meta.env.VITE_DEV_ADMIN_PASSWORD ?? '',
  },
  {
    label: 'Client',
    email: import.meta.env.VITE_DEV_CLIENT_EMAIL ?? '',
    password: import.meta.env.VITE_DEV_CLIENT_PASSWORD ?? '',
  },
]

export function DevQuickLogin() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function quickLogin(account: DevAccount) {
    if (!account.email || !account.password) return
    setLoading(account.label)
    try {
      const result = await login({
        email: account.email,
        password: account.password,
      })
      dispatch(setAuth({ user: result.user, accessToken: result.accessToken }))
      navigate(roleRedirect[result.user.role], { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(null)
    }
  }

  const configured = DEV_ACCOUNTS.filter(a => a.email && a.password)
  if (configured.length === 0) return null

  return (
    <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
      <p className="mb-3 text-center text-xs font-medium text-amber-600 uppercase tracking-wide">
        Dev quick login
      </p>
      <div className="flex gap-2">
        {configured.map(account => (
          <button
            key={account.label}
            onClick={() => {
              setError(null)
              quickLogin(account)
            }}
            disabled={loading !== null}
            className="flex-1 rounded-lg border border-amber-300 bg-white py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
          >
            {loading === account.label ? '…' : account.label}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-center text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
