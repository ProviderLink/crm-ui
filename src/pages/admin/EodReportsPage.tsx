import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { DataTable } from '@/components/shared/DataTable'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useAtsClientsQuery,
  useAtsVAsQuery,
  useEodSubmissionsQuery,
} from '@/hooks/queries'
import type { IEodSubmission } from '@/types/eod-submission'

export default function EodReportsPage() {
  const { data: allEods = [], isLoading } = useEodSubmissionsQuery()
  const { data: atsVAs = [] } = useAtsVAsQuery()
  const { data: atsClients = [] } = useAtsClientsQuery()

  const today = new Date().toISOString().split('T')[0]
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [dateFrom, setDateFrom] = useState(ninetyDaysAgo)
  const [dateTo, setDateTo] = useState(today)
  const [vaFilter, setVaFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')

  const vaMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const v of atsVAs) m[v.id] = `${v.firstName} ${v.lastName}`
    return m
  }, [atsVAs])

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const c of atsClients) m[c.id] = c.companyName
    return m
  }, [atsClients])

  const filtered = useMemo(
    () =>
      allEods.filter(e => {
        if (vaFilter !== 'all' && e.vaId !== vaFilter) return false
        if (clientFilter !== 'all' && e.clientId !== clientFilter) return false
        if (dateFrom && e.date < dateFrom) return false
        if (dateTo && e.date > dateTo) return false
        return true
      }),
    [allEods, vaFilter, clientFilter, dateFrom, dateTo]
  )

  const columns = useMemo<ColumnDef<IEodSubmission>[]>(
    () => [
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
        accessorKey: 'vaId',
        header: 'VA',
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-sm">
            {vaMap[getValue<string>()] ?? getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'clientId',
        header: 'Client',
        size: 210,
        cell: ({ getValue }) => (
          <span className="text-sm">
            {clientMap[getValue<string>()] ?? getValue<string>()}
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
        size: 70,
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
    ],
    [vaMap, clientMap]
  )

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
    setVaFilter('all')
    setClientFilter('all')
  }

  const hasFilter =
    dateFrom !== '' ||
    dateTo !== '' ||
    vaFilter !== 'all' ||
    clientFilter !== 'all'

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              EOD Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              All end-of-day submissions across VAs and clients
            </p>
          </div>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Select value={vaFilter} onValueChange={setVaFilter}>
              <SelectTrigger className="rounded-xl border-input h-8 text-sm w-44">
                <SelectValue placeholder="All VAs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All VAs</SelectItem>
                {atsVAs.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.firstName} {v.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="rounded-xl border-input h-8 text-sm w-44">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {atsClients.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            {hasFilter && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} records
            </span>
          </div>

          <DataTable columns={columns} data={filtered} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
