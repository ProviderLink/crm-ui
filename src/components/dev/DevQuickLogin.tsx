import { useAppDispatch } from '@/hooks/store'
import { login } from '@/services/auth.service'
import { setAuth } from '@/store/slices/authSlice'
import type { UserRole } from '@/types/auth'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const roleRedirect: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  account_manager: '/am/dashboard',
  va: '/va/dashboard',
  client: '/client/dashboard',
}

interface DevAccount {
  label: string
  email: string
  password: string
}

const DEMO_ACCOUNTS: DevAccount[] = [
  { label: 'Admin', email: 'admin@crm.dev', password: 'Dev1234!' },
  { label: 'Acc. Mgr', email: 'am@arista.dev', password: 'Dev1234!' },
  { label: 'VA', email: 'va@arista.dev', password: 'Dev1234!' },
  { label: 'Client', email: 'client@arista.dev', password: 'Dev1234!' },
]

export function DevQuickLogin() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState<string | null>(null) // tracks email being logged in
  const [error, setError] = useState<string | null>(null)

  async function quickLogin(account: DevAccount) {
    if (!account.email || !account.password) return
    setLoading(account.email)
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

  if (DEMO_ACCOUNTS.length === 0) return null

  function accountButtons(accounts: DevAccount[], tint: string) {
    return accounts.map(account => (
      <button
        key={account.email}
        onClick={() => {
          setError(null)
          quickLogin(account)
        }}
        disabled={loading !== null}
        className="flex-1 h-8 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors duration-150 disabled:opacity-40"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${tint}`,
          color: '#64748b',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
        onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
      >
        {loading === account.email ? (
          <span className="flex items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-full border border-slate-500 border-t-transparent animate-spin" />
          </span>
        ) : (
          account.label
        )}
      </button>
    ))
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          Dev
        </span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <div className="flex gap-2">
        {accountButtons(DEMO_ACCOUNTS, 'rgba(99,102,241,0.25)')}
      </div>

      {error && <p className="text-center text-[11px] text-red-400">{error}</p>}
    </div>
  )
}
