import type { ColumnDef } from '@tanstack/react-table'
import { useEffect, useState } from 'react'

import { DataTable } from '@/components/shared/DataTable'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatMinutes } from '@/lib/time'
import { getAllAssignments } from '@/services/assignments.service'
import { getEodSubmissions } from '@/services/eod-submissions.service'
import { getWorkEntries } from '@/services/work-entries.service'
import type { IAssignment } from '@/types/assignment'
import type { IEodSubmission } from '@/types/eod-submission'
import type { IWorkEntry, WorkEntryStatus } from '@/types/work-entry'

// ── Work Entry columns ────────────────────────────────────────────────────────

const STATUS_STYLES: Record<WorkEntryStatus, string> = {
  completed:
    'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  in_progress:
    'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  pending: 'bg-muted text-muted-foreground border-border',
}

const workColumns: ColumnDef<IWorkEntry>[] = [
  {
    accessorKey: 'entryDate',
    header: 'Date',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        {getValue<string>()?.slice(0, 10)}
      </span>
    ),
  },
  {
    accessorKey: 'entryTime',
    header: 'Time',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
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
      return (
        <span className="text-sm">
          {v.length > 55 ? `${v.slice(0, 55)}…` : v}
        </span>
      )
    },
  },
  {
    accessorKey: 'timeSpent',
    header: 'Time Spent',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        {formatMinutes(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue<WorkEntryStatus>()
      return (
        <span
          className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[s]}`}
        >
          {s.replace('_', ' ')}
        </span>
      )
    },
  },
]

// ── EOD Report columns ────────────────────────────────────────────────────────

const eodColumns: ColumnDef<IEodSubmission>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        {getValue<string>()?.slice(0, 10)}
      </span>
    ),
  },
  {
    accessorKey: 'shiftStart',
    header: 'Start',
    cell: ({ getValue }) => (
      <span className="text-sm">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'shiftEnd',
    header: 'End',
    cell: ({ getValue }) => (
      <span className="text-sm">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'hoursWorked',
    header: 'Hours',
    cell: ({ getValue }) => (
      <span className="text-sm font-medium text-foreground">
        {getValue<number>()}h
      </span>
    ),
  },
  {
    accessorKey: 'summaryOfWork',
    header: 'Summary',
    enableSorting: false,
    cell: ({ getValue }) => {
      const v = getValue<string>()
      return (
        <span className="text-sm">
          {v.length > 60 ? `${v.slice(0, 60)}…` : v}
        </span>
      )
    },
  },
  {
    accessorKey: 'pendingTasks',
    header: 'Pending Tasks',
    enableSorting: false,
    cell: ({ getValue }) => {
      const v = getValue<string>()
      return (
        <span className="text-sm text-muted-foreground">
          {v.length > 50 ? `${v.slice(0, 50)}…` : v}
        </span>
      )
    },
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkActivityPage() {
  const [assignments, setAssignments] = useState<IAssignment[]>([])
  const [allEntries, setAllEntries] = useState<IWorkEntry[]>([])
  const [allEods, setAllEods] = useState<IEodSubmission[]>([])
  const [filteredEntries, setFilteredEntries] = useState<IWorkEntry[]>([])
  const [filteredEods, setFilteredEods] = useState<IEodSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [assignmentFilter, setAssignmentFilter] = useState('all')

  // Load all data once on mount
  useEffect(() => {
    async function load() {
      try {
        const [asgns, entries, eods] = await Promise.all([
          getAllAssignments(),
          getWorkEntries(),
          getEodSubmissions(),
        ])
        setAssignments(asgns)
        setAllEntries(entries)
        setAllEods(eods)
        setFilteredEntries(entries)
        setFilteredEods(eods)
      } catch {
        setAllEntries([])
        setAllEods([])
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  // Re-filter whenever any filter state changes
  useEffect(() => {
    setFilteredEntries(
      allEntries.filter(e => {
        if (assignmentFilter !== 'all' && e.assignmentId !== assignmentFilter)
          return false
        if (dateFrom && e.entryDate < dateFrom) return false
        if (dateTo && e.entryDate > dateTo) return false
        return true
      })
    )
    setFilteredEods(
      allEods.filter(e => {
        if (assignmentFilter !== 'all' && e.assignmentId !== assignmentFilter)
          return false
        if (dateFrom && e.date < dateFrom) return false
        if (dateTo && e.date > dateTo) return false
        return true
      })
    )
  }, [allEntries, allEods, dateFrom, dateTo, assignmentFilter])

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
    setAssignmentFilter('all')
  }

  const hasActiveFilters =
    dateFrom !== '' || dateTo !== '' || assignmentFilter !== 'all'
  const multipleAssignments = assignments.length > 1

  function assignmentLabel(a: IAssignment): string {
    const type = a.serviceType ?? 'VA Service'
    return `${type} (from ${a.startDate})`
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Work Activity
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your VA's work entries and end-of-day reports
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {multipleAssignments && (
              <Select
                value={assignmentFilter}
                onValueChange={setAssignmentFilter}
              >
                <SelectTrigger className="rounded-xl border-input h-8 text-sm w-52">
                  <SelectValue placeholder="All assignments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assignments</SelectItem>
                  {assignments.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {assignmentLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="rounded-xl border-input h-8 text-sm w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To</span>
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="rounded-xl border-input h-8 text-sm w-36"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="work">
            <TabsList className="mb-4">
              <TabsTrigger value="work">
                Work Entries
                {!isLoading && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({filteredEntries.length})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="eod">
                EOD Reports
                {!isLoading && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({filteredEods.length})
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="work">
              <DataTable
                columns={workColumns}
                data={filteredEntries}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="eod">
              <DataTable
                columns={eodColumns}
                data={filteredEods}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
