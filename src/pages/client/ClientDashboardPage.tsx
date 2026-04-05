import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ActivityIcon, BriefcaseIcon, CalendarCheckIcon, ClockIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllAssignments } from '@/services/assignments.service'
import { getEodSubmissions } from '@/services/eod-submissions.service'
import { getWorkEntries } from '@/services/work-entries.service'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function weekStartStr() {
  const d = new Date()
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return d.toISOString().split('T')[0]
}

export default function ClientDashboardPage() {
  const today = todayStr()
  const weekStart = weekStartStr()

  const [activeAssignments, setActiveAssignments] = useState<number | null>(null)
  const [weekHours, setWeekHours] = useState<number | null>(null)
  const [lastEodDate, setLastEodDate] = useState<string | null>(null)
  const [todayCount, setTodayCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [assignments, workWeek, workToday, eods] = await Promise.all([
          getAllAssignments({ status: 'active' }),
          getWorkEntries({ dateFrom: weekStart, dateTo: today }),
          getWorkEntries({ dateFrom: today, dateTo: today }),
          getEodSubmissions(),
        ])
        setActiveAssignments(assignments.length)
        setWeekHours(workWeek.reduce((sum, e) => sum + e.time_spent, 0) / 60)
        setTodayCount(workToday.length)
        const sorted = [...eods].sort((a, b) => (b.date > a.date ? 1 : -1))
        setLastEodDate(sorted[0]?.date ?? null)
      } catch {
        // Dashboard is informational — silently skip on error
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [today, weekStart])

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

        {/* Stat cards */}
        <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card lg:px-6">

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Active Assignments</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? <Skeleton className="h-8 w-12" /> : (activeAssignments ?? 0)}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <BriefcaseIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">Active VA engagements</div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>This Week's Hours</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading || weekHours === null
                  ? <Skeleton className="h-8 w-20" />
                  : `${weekHours.toFixed(1)}h`}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ClockIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">Hours billed by your VA Mon–today</div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Last EOD Submitted</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? <Skeleton className="h-8 w-28" /> : (lastEodDate ?? 'None yet')}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <CalendarCheckIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">Most recent end-of-day report date</div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Entries Today</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? <Skeleton className="h-8 w-12" /> : (todayCount ?? 0)}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ActivityIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">Work entries logged by your VA today</div>
            </CardFooter>
          </Card>

        </div>

        {/* Quick action */}
        <div className="flex gap-3 px-4 lg:px-6">
          <Button asChild>
            <Link to="/client/work">
              <ActivityIcon className="size-4" />
              View Work Activity
            </Link>
          </Button>
        </div>

      </div>
    </div>
  )
}
