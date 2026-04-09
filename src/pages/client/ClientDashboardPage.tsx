import {
  ActivityIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  ClockIcon,
  UserIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllAssignments } from '@/services/assignments.service'
import { getEodSubmissions } from '@/services/eod-submissions.service'
import { getWorkEntries } from '@/services/work-entries.service'
import type { IAssignment } from '@/types/assignment'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function weekStartStr() {
  const d = new Date()
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return d.toISOString().split('T')[0]
}

const statusVariant: Record<
  IAssignment['status'],
  'default' | 'secondary' | 'destructive'
> = {
  active: 'default',
  paused: 'secondary',
  ended: 'destructive',
}

export default function ClientDashboardPage() {
  const today = todayStr()
  const weekStart = weekStartStr()

  const [assignments, setAssignments] = useState<IAssignment[]>([])
  const [activeAssignments, setActiveAssignments] = useState<number | null>(
    null
  )
  const [weekHours, setWeekHours] = useState<number | null>(null)
  const [lastEodDate, setLastEodDate] = useState<string | null>(null)
  const [todayCount, setTodayCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [assignmentList, workWeek, workToday, eods] = await Promise.all([
          getAllAssignments({ status: 'active' }),
          getWorkEntries({ dateFrom: weekStart, dateTo: today }),
          getWorkEntries({ dateFrom: today, dateTo: today }),
          getEodSubmissions(),
        ])
        setAssignments(assignmentList)
        setActiveAssignments(assignmentList.length)
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
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  (activeAssignments ?? 0)
                )}
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
                {loading || weekHours === null ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  `${weekHours.toFixed(1)}h`
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ClockIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                Hours billed by your VA Mon–today
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Last EOD Submitted</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  (lastEodDate ?? 'None yet')
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <CalendarCheckIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                Most recent end-of-day report date
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Entries Today</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  (todayCount ?? 0)
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ActivityIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                Work entries logged by your VA today
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Your VA Engagements */}
        <div className="px-4 lg:px-6">
          <h2 className="mb-3 text-base font-semibold">Your VA Engagements</h2>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map(n => (
                <Card key={n}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-1 h-3 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-28" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No active VA engagements found.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assignments.map(a => (
                <Card
                  key={a.id}
                  className="bg-gradient-to-t from-primary/5 to-card shadow-xs"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserIcon className="size-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">
                          {a.service_type ?? 'VA Engagement'}
                        </CardTitle>
                      </div>
                      <Badge
                        variant={statusVariant[a.status]}
                        className="capitalize text-xs"
                      >
                        {a.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Started {a.start_date}
                      {a.end_date ? ` · Ends ${a.end_date}` : ''}
                    </CardDescription>
                  </CardHeader>
                  {a.notes && (
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {a.notes}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
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
