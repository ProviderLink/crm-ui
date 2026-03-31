import { useState, Suspense } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Plus, ClipboardList, FileCheck, History,
  LogOut, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { clearAuth } from '@/store/slices/authSlice'

const navItems = [
  { to: '/va/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/va/work/new',     icon: Plus,            label: 'Add Work Entry' },
  { to: '/va/work/history', icon: ClipboardList,   label: 'Work History' },
  { to: '/va/eod/new',      icon: FileCheck,       label: 'Submit EOD' },
  { to: '/va/eod/history',  icon: History,         label: 'EOD History' },
]

export function VaLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)

  function handleLogout() {
    dispatch(clearAuth())
    navigate('/login', { replace: true })
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#F5F7FB]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 flex w-60 flex-col',
        'bg-white border-r border-slate-100',
        'transition-transform duration-200 ease-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:relative lg:translate-x-0 lg:flex-shrink-0',
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
          <span className="text-base font-semibold bg-gradient-to-r from-[#7B6CF6] to-[#5AC8FA] bg-clip-text text-transparent">
            Arista CRM
          </span>
          <button
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-[#EDE9FE] text-[#7B6CF6] font-medium'
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]',
              )}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-slate-100 px-3 py-4 space-y-1">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-[#0F172A] truncate">{user?.name ?? '—'}</p>
            <p className="text-xs text-[#94A3B8]">Virtual Assistant</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#64748B] hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex h-16 flex-shrink-0 items-center border-b border-slate-100 bg-white px-4 lg:px-6">
          <button
            className="mr-3 rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100 transition-colors lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <span className="text-xs text-[#94A3B8]">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>

      </div>
    </div>
  )
}
