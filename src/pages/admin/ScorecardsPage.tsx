import { useState, useEffect, useCallback } from 'react'
import { BarChart3Icon, RefreshCwIcon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/shared/DataTable'
import { getScorecards, generateScorecards } from '@/services/scorecards.service'
import { getAtsVAs } from '@/services/ats.service'
import type { IScorecard } from '@/types/scorecard'
import type { IAtsCandidate } from '@/types/ats'

function pct(n: number) {
  return `${(n * 100).toFixed(0)}%`
}

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-destructive'
}

export default function ScorecardsPage() {
  const [scorecards, setScorecards] = useState<IScorecard[]>([])
  const [vaMap, setVaMap] = useState<Record<string, string>>({})
  const [vaList, setVaList] = useState<IAtsCandidate[]>([])
  const [vaFilter, setVaFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const load = useCallback(() => {
    setIsLoading(true)
    const vaId = vaFilter === 'all' ? undefined : vaFilter
    Promise.all([getScorecards(vaId), getAtsVAs()])
      .then(([cards, vas]) => {
        setScorecards(cards)
        const map: Record<string, string> = {}
        for (const v of vas) map[v.id] = `${v.firstName} ${v.lastName}`
        setVaMap(map)
        setVaList(vas)
      })
      .catch(() => setScorecards([]))
      .finally(() => setIsLoading(false))
  }, [vaFilter])

  useEffect(() => { load() }, [load])

  async function handleGenerate() {
    setGenerating(true)
    try {
      await generateScorecards()
      load()
    } catch {
      // silently ignore
    } finally {
      setGenerating(false)
    }
  }

  const columns: ColumnDef<IScorecard>[] = [
    {
      accessorKey: 'vaId',
      header: 'VA',
      cell: ({ getValue }) => (
        <span className="text-sm font-medium">
          {vaMap[getValue<string>()] ?? getValue<string>().slice(-8)}
        </span>
      ),
    },
    {
      accessorKey: 'weekStart',
      header: 'Week',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.weekStart?.slice(0, 10)} – {row.original.weekEnd?.slice(0, 10)}
        </span>
      ),
    },
    {
      accessorKey: 'totalHours',
      header: 'Hours',
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums">{getValue<number>().toFixed(1)}h</span>
      ),
    },
    {
      accessorKey: 'totalTasksCompleted',
      header: 'Tasks',
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'eodComplianceRate',
      header: 'EOD Rate',
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums">{getValue<number>().toFixed(0)}%</span>
      ),
    },
    {
      accessorKey: 'productivityScore',
      header: 'Score',
      cell: ({ getValue }) => {
        const s = getValue<number>()
        return (
          <span className={`text-sm font-semibold tabular-nums ${scoreColor(s)}`}>
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
              <h1 className="text-2xl font-semibold text-foreground">Productivity Scorecards</h1>
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
                  {vaList.map((v) => (
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
            <div className="ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                disabled={generating}
              >
                <RefreshCwIcon className={`size-3.5 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Generating…' : 'Generate Now'}
              </Button>
            </div>
          </div>

          <DataTable columns={columns} data={scorecards} isLoading={isLoading} />

        </div>
      </div>
    </div>
  )
}
