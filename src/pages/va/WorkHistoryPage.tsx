import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/shared/DataTable'
import { getWorkEntries } from '@/services/work-entries.service'
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry'
import { formatMinutes } from '@/lib/time'
import type { ColumnDef } from '@tanstack/react-table'

const STATUS_STYLES: Record<WorkEntryStatus, string> = {
  completed:   'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  in_progress: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  pending:     'bg-muted text-muted-foreground border-border',
}

const columns: ColumnDef<IWorkEntry>[] = [
  {
    accessorKey: 'entryDate',
    header: 'Date',
    cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue<string>()?.slice(0, 10)}</span>,
  },
  {
    accessorKey: 'entryTime',
    header: 'Time',
    cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'taskCategory',
    header: 'Category',
    cell: ({ getValue }) => (
      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'taskDescription',
    header: 'Description',
    enableSorting: false,
    cell: ({ getValue }) => {
      const v = getValue<string>()
      return <span className="text-sm">{v.length > 55 ? `${v.slice(0, 55)}…` : v}</span>
    },
  },
  {
    accessorKey: 'timeSpent',
    header: 'Time Spent',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">{formatMinutes(getValue<number>())}</span>
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
        const d = e.entryDate?.slice(0, 10) ?? ''
        if (dateFrom && d < dateFrom) return false
        if (dateTo && d > dateTo) return false
        return true
      }),
    )
  }, [entries, dateFrom, dateTo])

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Work History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All your logged work entries</p>
        </div>
        <Link
          to="/va/work/new"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity"
        >
          + Add Entry
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">From</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border-input h-8 text-sm w-36"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">To</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border-input h-8 text-sm w-36"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} records</span>
      </div>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
