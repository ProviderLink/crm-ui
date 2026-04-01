import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/shared/DataTable'
import { getWorkEntries } from '@/services/work-entries.service'
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry'
import { formatMinutes } from '@/lib/time'
import type { ColumnDef } from '@tanstack/react-table'

const STATUS_STYLES: Record<WorkEntryStatus, string> = {
  completed:   'bg-green-50 text-green-700 border-green-100',
  in_progress: 'bg-orange-50 text-orange-600 border-orange-100',
  pending:     'bg-slate-50 text-slate-500 border-slate-200',
}

const columns: ColumnDef<IWorkEntry>[] = [
  {
    accessorKey: 'entry_date',
    header: 'Date',
    cell: ({ getValue }) => <span className="text-xs text-[#64748B]">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'entry_time',
    header: 'Time',
    cell: ({ getValue }) => <span className="text-xs text-[#64748B]">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'task_category',
    header: 'Category',
    cell: ({ getValue }) => (
      <span className="text-xs px-2 py-0.5 rounded-full bg-[#E1F2AE] text-[#0F172A]">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'task_description',
    header: 'Description',
    enableSorting: false,
    cell: ({ getValue }) => {
      const v = getValue<string>()
      return <span className="text-sm">{v.length > 55 ? `${v.slice(0, 55)}…` : v}</span>
    },
  },
  {
    accessorKey: 'time_spent',
    header: 'Time Spent',
    cell: ({ getValue }) => (
      <span className="text-xs text-[#64748B]">{formatMinutes(getValue<number>())}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue<WorkEntryStatus>()
      return (
        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[s]}`}>
          {s.replace('_', ' ')}
        </span>
      )
    },
  },
]

export default function WorkHistoryPage() {
  const [entries, setEntries] = useState<IWorkEntry[]>([])
  const [filtered, setFiltered] = useState<IWorkEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    getWorkEntries()
      .then((data) => { setEntries(data); setFiltered(data) })
      .catch(() => setEntries([]))
      .finally(() => setIsLoading(false))
  }, [])

  // Client-side date filter
  useEffect(() => {
    setFiltered(
      entries.filter((e) => {
        if (dateFrom && e.entry_date < dateFrom) return false
        if (dateTo && e.entry_date > dateTo) return false
        return true
      }),
    )
  }, [entries, dateFrom, dateTo])

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">Work History</h1>
          <p className="text-sm text-[#64748B] mt-0.5">All your logged work entries</p>
        </div>
        <Link
          to="/va/work/new"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white bg-black hover:bg-black/90 transition-opacity"
        >
          + Add Entry
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
            className="text-xs text-slate-500 hover:text-[#0F172A] hover:underline"
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
