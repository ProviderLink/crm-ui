import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/shared/DataTable'
import { getEodSubmissions } from '@/services/eod-submissions.service'
import type { IEodSubmission } from '@/types/eod-submission'
import type { ColumnDef } from '@tanstack/react-table'

const columns: ColumnDef<IEodSubmission>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ getValue }) => <span className="text-xs text-[#64748B]">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'shift_start',
    header: 'Start',
    cell: ({ getValue }) => <span className="text-sm">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'shift_end',
    header: 'End',
    cell: ({ getValue }) => <span className="text-sm">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'hours_worked',
    header: 'Hours',
    cell: ({ getValue }) => (
      <span className="text-sm font-medium text-[#0F172A]">{getValue<number>()}h</span>
    ),
  },
  {
    accessorKey: 'summary_of_work',
    header: 'Summary',
    enableSorting: false,
    cell: ({ getValue }) => {
      const v = getValue<string>()
      return <span className="text-sm">{v.length > 60 ? `${v.slice(0, 60)}…` : v}</span>
    },
  },
]

export default function EodHistoryPage() {
  const [eods, setEods] = useState<IEodSubmission[]>([])
  const [filtered, setFiltered] = useState<IEodSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    getEodSubmissions()
      .then((data) => { setEods(data); setFiltered(data) })
      .catch(() => setEods([]))
      .finally(() => setIsLoading(false))
  }, [])

  // Client-side date filter
  useEffect(() => {
    setFiltered(
      eods.filter((e) => {
        if (dateFrom && e.date < dateFrom) return false
        if (dateTo && e.date > dateTo) return false
        return true
      }),
    )
  }, [eods, dateFrom, dateTo])

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">EOD History</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Your end-of-day submissions</p>
        </div>
        <Link
          to="/va/eod/new"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#7B6CF6] to-[#5AC8FA] hover:opacity-90 transition-opacity"
        >
          + Submit EOD
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94A3B8]">From</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border-slate-200 h-8 text-sm w-36"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94A3B8]">To</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border-slate-200 h-8 text-sm w-36"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={clearFilters}
            className="text-xs text-[#7B6CF6] hover:underline"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-[#94A3B8] ml-auto">{filtered.length} records</span>
      </div>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />
    </div>
  )
}
