import {
  ClipboardCheckIcon,
  ClockIcon,
  PlusIcon,
  TrophyIcon,
  ZapIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getEodSubmissions } from '@/services/eod-submissions.service'
import { getScorecards } from '@/services/scorecards.service'
import { getWorkEntries } from '@/services/work-entries.service'
import type { IEodSubmission } from '@/types/eod-submission'
import type { IWorkEntry } from '@/types/work-entry'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function weekStartStr() {
  const d = new Date()
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return d.toISOString().split('T')[0]
}

export default function VaDashboardPage() {
  const today = todayStr()
  const weekStart = weekStartStr()

  const [todayEntries, setTodayEntries] = useState<IWorkEntry[]>([])
  const [eodToday, setEodToday] = useState<IEodSubmission | null>(null)
  const [weekHours, setWeekHours] = useState<number | null>(null)
  const [latestScore, setLatestScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [workAll, eods, scorecards] = await Promise.all([
          getWorkEntries(),
          getEodSubmissions(),
          getScorecards(),
        ])
        const workToday = workAll.filter(e => e.entryDate.slice(0, 10) === today)
        const workWeek = workAll.filter(e => e.entryDate.slice(0, 10) >= weekStart)
        setTodayEntries(workToday)
        setEodToday(eods.find(e => e.date.slice(0, 10) === today) ?? null)
        setWeekHours(workWeek.reduce((sum, e) => sum + e.timeSpent, 0) / 60)
        const sorted = [...scorecards].sort(
          (a, b) =>
            new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
        )
        setLatestScore(sorted[0]?.productivityScore ?? null)
      } catch {
        // dashboard is informational — silently skip on error
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [today, weekStart])

  const eodSubmitted = Boolean(eodToday)

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Stat cards */}
        <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card lg:px-6">
          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Entries Today</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  todayEntries.length
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ClockIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                Work entries logged today
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>EOD Status</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : eodSubmitted ? (
                  'Submitted'
                ) : (
                  'Pending'
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ClipboardCheckIcon
                  className={`size-4 ${!loading && eodSubmitted ? 'text-green-500' : 'text-muted-foreground'}`}
                />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                End-of-day report for today
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>This Week's Hours</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading || weekHours === null ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  `${weekHours.toFixed(1)}h`
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ZapIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                Total time logged Mon–today
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Productivity Score</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : latestScore !== null ? (
                  `${latestScore}`
                ) : (
                  'N/A'
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <TrophyIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                Latest weekly scorecard (0–100)
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 px-4 lg:px-6">
          <Button asChild>
            <Link to="/va/work/new">
              <PlusIcon className="size-4" />
              Log Work Entry
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/va/eod/new">
              <ClipboardCheckIcon className="size-4" />
              {eodSubmitted ? 'EOD Submitted ✓' : 'Submit EOD'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
