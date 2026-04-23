import { DatePickerField } from '@/components/ui/date-picker-field'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { DataTable } from '@/components/shared/DataTable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useAllAssignmentsQuery,
  useAtsVAsQuery,
  useEodSubmissionsQuery,
  useWorkEntriesQuery,
} from '@/hooks/queries'
import { formatMinutes } from '@/lib/time'
import type { IAssignment } from '@/types/assignment'
import type { IAtsCandidate } from '@/types/ats'
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

function buildWorkColumns(vaMap: Map<string, string>): ColumnDef<IWorkEntry>[] {
  return [
    {
      accessorKey: 'vaId',
      header: 'VA',
      size: 140,
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-foreground">
          {vaMap.get(getValue<string>()) ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'entryDate',
      header: 'Date',
      size: 105,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {getValue<string>()?.slice(0, 10)}
        </span>
      ),
    },
    {
      accessorKey: 'entryTime',
      header: 'Time',
      size: 75,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'taskCategory',
      header: 'Category',
      size: 160,
      cell: ({ getValue }) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary whitespace-nowrap">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'taskDescription',
      header: 'Description',
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'timeSpent',
      header: 'Time Spent',
      size: 95,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {formatMinutes(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 125,
      cell: ({ getValue }) => {
        const s = getValue<WorkEntryStatus>()
        return (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLES[s]}`}
          >
            {s.replace('_', ' ')}
          </span>
        )
      },
    },
  ]
}

// ── EOD Report columns ────────────────────────────────────────────────────────

function buildEodColumns(
  vaMap: Map<string, string>
): ColumnDef<IEodSubmission>[] {
  return [
    {
      accessorKey: 'vaId',
      header: 'VA',
      size: 140,
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-foreground">
          {vaMap.get(getValue<string>()) ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      size: 105,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {getValue<string>()?.slice(0, 10)}
        </span>
      ),
    },
    {
      accessorKey: 'shiftStart',
      header: 'Start',
      size: 70,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'shiftEnd',
      header: 'End',
      size: 70,
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'hoursWorked',
      header: 'Hours',
      size: 75,
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
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'pendingTasks',
      header: 'Pending Tasks',
      size: 200,
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
  ]
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkActivityPage() {
  const { data: assignments = [], isLoading: loadingAssignments } =
    useAllAssignmentsQuery()
  const { data: allEntries = [], isLoading: loadingEntries } =
    useWorkEntriesQuery()
  const { data: allEods = [], isLoading: loadingEods } =
    useEodSubmissionsQuery()
  const { data: atsVAs = [] } = useAtsVAsQuery()
  const isLoading = loadingAssignments || loadingEntries || loadingEods

  const vaMap = useMemo(() => {
    const m = new Map<string, string>()
    atsVAs.forEach((v: IAtsCandidate) =>
      m.set(v.id, `${v.firstName} ${v.lastName}`)
    )
    return m
  }, [atsVAs])

  const workColumns = useMemo(() => buildWorkColumns(vaMap), [vaMap])
  const eodColumns = useMemo(() => buildEodColumns(vaMap), [vaMap])

  const [dateFrom, setDateFrom] = useState(
    () =>
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
  )
  const [dateTo, setDateTo] = useState(
    () => new Date().toISOString().split('T')[0]
  )
  const [assignmentFilter, setAssignmentFilter] = useState('all')

  const filteredEntries = useMemo(
    () =>
      allEntries.filter(e => {
        if (assignmentFilter !== 'all' && e.assignmentId !== assignmentFilter)
          return false
        if (dateFrom && e.entryDate < dateFrom) return false
        if (dateTo && e.entryDate > dateTo) return false
        return true
      }),
    [allEntries, dateFrom, dateTo, assignmentFilter]
  )

  const filteredEods = useMemo(
    () =>
      allEods.filter(e => {
        if (assignmentFilter !== 'all' && e.assignmentId !== assignmentFilter)
          return false
        if (dateFrom && e.date < dateFrom) return false
        if (dateTo && e.date > dateTo) return false
        return true
      }),
    [allEods, dateFrom, dateTo, assignmentFilter]
  )

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
    setAssignmentFilter('all')
  }

  const hasActiveFilters =
    dateFrom !== '' || dateTo !== '' || assignmentFilter !== 'all'
  const multipleAssignments = assignments.length > 1

  function assignmentLabel(a: IAssignment): string {
    const name = vaMap.get(a.vaId)
    return name ? `${name} — ${a.serviceType ?? 'VA Service'}` : (a.serviceType ?? 'VA Service')
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
              <DatePickerField
                value={dateFrom}
                onChange={v => setDateFrom(v)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To</span>
              <DatePickerField value={dateTo} onChange={v => setDateTo(v)} />
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
