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
    label: 'Admin',
    email: import.meta.env.VITE_DEV_ADMIN_EMAIL ?? '',
    password: import.meta.env.VITE_DEV_ADMIN_PASSWORD ?? '',
  },
  {
    label: 'Acc. Mgr',
    email: import.meta.env.VITE_DEV_ACCOUNT_MANAGER_EMAIL ?? '',
    password: import.meta.env.VITE_DEV_ACCOUNT_MANAGER_PASSWORD ?? '',
  },
  {
    label: 'VA',
    email: import.meta.env.VITE_DEV_VA_EMAIL ?? '',
    password: import.meta.env.VITE_DEV_VA_PASSWORD ?? '',
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
    <div className="mt-6">
      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          Dev
        </span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <div className="flex gap-2">
        {configured.map(account => (
          <button
            key={account.label}
            onClick={() => {
              setError(null)
              quickLogin(account)
            }}
            disabled={loading !== null}
            className="flex-1 h-8 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors duration-150 disabled:opacity-40"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#64748b',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            {loading === account.label ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-slate-500 border-t-transparent animate-spin" />
              </span>
            ) : (
              account.label
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-center text-[11px] text-red-400">{error}</p>
      )}
    </div>
  )
}
