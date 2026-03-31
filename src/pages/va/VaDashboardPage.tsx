import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, CheckCircle2, AlertCircle, BarChart3, Plus, FileCheck } from 'lucide-react'
import { useAppSelector } from '@/hooks/store'
import { getWorkEntries } from '@/services/work-entries.service'
import { getEodSubmissions } from '@/services/eod-submissions.service'
import { getScorecards } from '@/services/scorecards.service'
import type { IWorkEntry } from '@/types/work-entry'
import { formatMinutes, todayString } from '@/lib/time'

type DashboardState = {
  todayEntries: IWorkEntry[]
  eodSubmitted: boolean
  weekScore: number | null
  isLoading: boolean
}

const STATUS_STYLES = {
  completed:   'bg-green-50 text-green-700',
  in_progress: 'bg-orange-50 text-orange-600',
  pending:     'bg-slate-50 text-slate-500',
} as const

export default function VaDashboardPage() {
  const user = useAppSelector((s) => s.auth.user)
  const today = todayString()

  const [state, setState] = useState<DashboardState>({
    todayEntries: [],
    eodSubmitted: false,
    weekScore:    null,
    isLoading:    true,
  })

  useEffect(() => {
    Promise.all([
      getWorkEntries({ dateFrom: today, dateTo: today }),
      getEodSubmissions({ dateFrom: today, dateTo: today }),
      getScorecards(),
    ])
      .then(([entries, eods, scorecards]) => {
        setState({
          todayEntries: entries,
          eodSubmitted: eods.length > 0,
          weekScore:    scorecards[0]?.productivity_score ?? null,
          isLoading:    false,
        })
      })
      .catch(() => setState((s) => ({ ...s, isLoading: false })))
  }, [today])

  const { todayEntries, eodSubmitted, weekScore, isLoading } = state

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Dashboard</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Welcome back, {user?.name ?? '—'}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={ClipboardList}
          title="Today's Entries"
          value={isLoading ? '—' : todayEntries.length}
          sub="work tasks logged today"
        />
        <StatCard
          icon={eodSubmitted ? CheckCircle2 : AlertCircle}
          title="EOD Status"
          value={isLoading ? '—' : eodSubmitted ? 'Submitted' : 'Not Submitted'}
          sub={eodSubmitted ? 'End-of-day report done' : 'Submit before end of shift'}
          accent={!isLoading && !eodSubmitted ? 'warning' : undefined}
        />
        <StatCard
          icon={BarChart3}
          title="Week Score"
          value={isLoading ? '—' : weekScore !== null ? `${weekScore}/100` : 'Pending'}
          sub="productivity score"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to="/va/work/new"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#7B6CF6] to-[#5AC8FA] hover:opacity-90 transition-opacity"
        >
          <Plus size={15} />
          Add Work Entry
        </Link>
        {!eodSubmitted && (
          <Link
            to="/va/eod/new"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-[#7B6CF6] bg-[#EDE9FE] hover:bg-[#DDD6FE] transition-colors"
          >
            <FileCheck size={15} />
            Submit EOD
          </Link>
        )}
      </div>

      {/* Today's work entries */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-[#0F172A]">Today's Work</h2>
          <Link to="/va/work/history" className="text-xs text-[#7B6CF6] hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : todayEntries.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#94A3B8]">
            No work entries today. <Link to="/va/work/new" className="text-[#7B6CF6] hover:underline">Add one now.</Link>
          </p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {todayEntries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xs text-[#94A3B8] w-12 flex-shrink-0">{entry.entry_time}</span>
                <span className="flex-1 text-sm text-[#0F172A] truncate">{entry.task_description}</span>
                <span className="text-xs text-[#94A3B8] flex-shrink-0">{formatMinutes(entry.time_spent)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[entry.status]}`}>
                  {entry.status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────

import type { LucideIcon } from 'lucide-react'

function StatCard({
  icon: Icon, title, value, sub, accent,
}: {
  icon: LucideIcon
  title: string
  value: string | number
  sub?: string
  accent?: 'warning'
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon
          size={15}
          className={accent === 'warning' ? 'text-orange-400' : 'text-[#94A3B8]'}
        />
        <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">{title}</span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${accent === 'warning' ? 'text-orange-500' : 'text-[#0F172A]'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#94A3B8] mt-1">{sub}</p>}
    </div>
  )
}
