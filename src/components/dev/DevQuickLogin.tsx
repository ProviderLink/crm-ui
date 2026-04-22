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
  sub: string
  email: string
  password: string
  color: string
}

const DEMO_ACCOUNTS: DevAccount[] = [
  { label: 'Admin',       sub: 'admin@crm.dev',     email: 'admin@crm.dev',     password: 'Dev1234!', color: '#6366f1' },
  { label: 'Acc. Mgr',   sub: 'am@arista.dev',     email: 'am@arista.dev',     password: 'Dev1234!', color: '#8b5cf6' },
  { label: 'VA — Maria', sub: 'va@arista.dev',      email: 'va@arista.dev',     password: 'Dev1234!', color: '#0ea5e9' },
  { label: 'VA — James', sub: 'va2@arista.dev',     email: 'va2@arista.dev',    password: 'Dev1234!', color: '#0ea5e9' },
  { label: 'Sunrise',    sub: 'client@arista.dev',  email: 'client@arista.dev', password: 'Dev1234!', color: '#10b981' },
  { label: 'BrightCare', sub: 'client2@arista.dev', email: 'client2@arista.dev',password: 'Dev1234!', color: '#10b981' },
]

export function DevQuickLogin() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function quickLogin(account: DevAccount) {
    setError(null)
    setLoading(account.email)
    try {
      const result = await login({ email: account.email, password: account.password })
      dispatch(setAuth({ user: result.user, accessToken: result.accessToken }))
      navigate(roleRedirect[result.user.role], { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest select-none">
          Demo Accounts
        </span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {DEMO_ACCOUNTS.map(account => {
          const isLoading = loading === account.email
          return (
            <button
              key={account.email}
              onClick={() => quickLogin(account)}
              disabled={loading !== null}
              className="group relative flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg text-left transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(255,255,255,0.07)`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${account.color}14`
                e.currentTarget.style.borderColor = `${account.color}40`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              }}
            >
              {isLoading ? (
                <span className="flex w-full items-center justify-center py-1">
                  <span
                    className="h-3 w-3 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: `${account.color}60`, borderTopColor: 'transparent' }}
                  />
                </span>
              ) : (
                <>
                  <span className="text-[11px] font-semibold text-slate-300 leading-none">
                    {account.label}
                  </span>
                  <span className="text-[10px] text-slate-600 leading-none truncate w-full">
                    {account.sub}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-center text-[10px] text-slate-700 select-none">
        All accounts · password: <span className="text-slate-600">Dev1234!</span>
      </p>


      {error && (
        <p className="text-center text-[11px] text-red-400">{error}</p>
      )}
    </div>
  )
}
