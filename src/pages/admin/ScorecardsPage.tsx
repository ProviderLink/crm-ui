import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { BarChart3Icon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'

import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAtsVAsQuery, useScorecardsQuery } from '@/hooks/queries'
import { generateScorecards } from '@/services/scorecards.service'
import type { IScorecard } from '@/types/scorecard'

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-destructive'
}

export default function ScorecardsPage() {
  const queryClient = useQueryClient()
  const [vaFilter, setVaFilter] = useState<string>('all')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const vaId = vaFilter === 'all' ? undefined : vaFilter
  const { data: scorecards = [], isLoading } = useScorecardsQuery(vaId)
  const { data: vaList = [] } = useAtsVAsQuery()

  const vaMap: Record<string, string> = {}
  for (const v of vaList) vaMap[v.id] = `${v.firstName} ${v.lastName}`

  async function handleGenerate() {
    setGenerating(true)
    setGenerateError(null)
    try {
      await generateScorecards()
      queryClient.invalidateQueries({ queryKey: ['scorecards'] })
    } catch {
      setGenerateError('Failed to generate scorecards. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const columns: ColumnDef<IScorecard>[] = [
    {
      accessorKey: 'vaId',
      header: 'VA',
      size: 155,
      cell: ({ getValue }) => (
        <span className="text-sm font-medium">
          {vaMap[getValue<string>()] ?? getValue<string>().slice(-8)}
        </span>
      ),
    },
    {
      accessorKey: 'weekStart',
      header: 'Week',
      size: 210,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {row.original.weekStart?.slice(0, 10)} –{' '}
          {row.original.weekEnd?.slice(0, 10)}
        </span>
      ),
    },
    {
      accessorKey: 'totalHours',
      header: 'Hours',
      size: 80,
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums">
          {getValue<number>().toFixed(1)}h
        </span>
      ),
    },
    {
      accessorKey: 'totalTasksCompleted',
      header: 'Tasks',
      size: 75,
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'eodComplianceRate',
      header: 'EOD Rate',
      size: 95,
      cell: ({ getValue }) => {
        const v = getValue<number>()
        return (
          <span className={`text-sm tabular-nums font-medium ${scoreColor(v)}`}>
            {v.toFixed(0)}%
          </span>
        )
      },
    },
    {
      accessorKey: 'productivityScore',
      header: 'Score',
      size: 80,
      cell: ({ getValue }) => {
        const s = getValue<number>()
        const colorClass =
          s >= 80
            ? 'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400'
            : s >= 60
              ? 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400'
              : 'bg-red-500/10 text-destructive border-destructive/30'
        return (
          <span
            className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full border whitespace-nowrap ${colorClass}`}
          >
            {s.toFixed(0)}
          </span>
        )
      },
    },
  ]

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Productivity Scorecards
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Weekly performance scores — generated every Sunday at 11 PM
              </p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3Icon className="size-4" />
              <span className="text-sm">{scorecards.length} records</span>
            </div>
          </div>

          {/* Filters + actions */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">VA</span>
              <Select value={vaFilter} onValueChange={setVaFilter}>
                <SelectTrigger className="h-8 w-44 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All VAs</SelectItem>
                  {vaList.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.firstName} {v.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {vaFilter !== 'all' && (
              <button
                onClick={() => setVaFilter('all')}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {generateError && (
                <p className="text-xs text-destructive">{generateError}</p>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="border border-white/10 hover:border-white/20 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                onClick={handleGenerate}
                disabled={generating}
              >
                <RefreshCwIcon
                  className={`size-3.5 ${generating ? 'animate-spin' : ''}`}
                />
                {generating ? 'Generating…' : 'Generate Now'}
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={scorecards}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
