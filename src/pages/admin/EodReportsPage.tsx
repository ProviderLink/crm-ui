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

  const [filtered, setFiltered] = useState<IEodSubmission[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [vaFilter, setVaFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')

  useEffect(() => {
    setFiltered(
      allEods.filter(e => {
        if (vaFilter !== 'all' && e.vaId !== vaFilter) return false
        if (clientFilter !== 'all' && e.clientId !== clientFilter) return false
        if (dateFrom && e.date < dateFrom) return false
        if (dateTo && e.date > dateTo) return false
        return true
      })
    )
  }, [allEods, vaFilter, clientFilter, dateFrom, dateTo])

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
    setVaFilter('all')
    setClientFilter('all')
  }

  const vaMap: Record<string, string> = {}
  for (const v of atsVAs) vaMap[v.id] = `${v.firstName} ${v.lastName}`

  const clientMap: Record<string, string> = {}
  for (const c of atsClients) clientMap[c.id] = c.companyName

  const hasFilter =
    dateFrom !== '' ||
    dateTo !== '' ||
    vaFilter !== 'all' ||
    clientFilter !== 'all'

  const columns: ColumnDef<IEodSubmission>[] = [
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
      accessorKey: 'vaId',
      header: 'VA',
      cell: ({ getValue }) => (
        <span className="text-sm">
          {vaMap[getValue<string>()] ?? getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'clientId',
      header: 'Client',
      cell: ({ getValue }) => (
        <span className="text-sm">
          {clientMap[getValue<string>()] ?? getValue<string>()}
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
            {v.length > 55 ? `${v.slice(0, 55)}…` : v}
          </span>
        )
      },
    },
  ]

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
