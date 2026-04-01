import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangleIcon, ClipboardXIcon, UserCheckIcon, UsersIcon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/DataTable'
import { getDashboardStats, type IDashboardStats } from '@/services/admin.service'
import { getAtsVAs } from '@/services/ats.service'
import { useAppSelector } from '@/hooks/store'

type VABreakdownRow = { vaName: string; count: number }

const breakdownColumns: ColumnDef<VABreakdownRow>[] = [
  { accessorKey: 'vaName', header: 'VA' },
  { accessorKey: 'count', header: 'Entries Today' },
]

export default function AdminDashboardPage() {
  const user = useAppSelector((s) => s.auth.user)
  const isAccountManager = user?.role === 'account_manager'

  const [stats, setStats] = useState<IDashboardStats | null>(null)
  const [breakdown, setBreakdown] = useState<VABreakdownRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, vas] = await Promise.all([getDashboardStats(), getAtsVAs()])
        setStats(s)

        const vaMap: Record<string, string> = {}
        for (const va of vas) {
          vaMap[va.id] = `${va.firstName} ${va.lastName}`
        }

        const rows = Object.entries(s.perVABreakdown).map(([vaId, count]) => ({
          vaName: vaMap[vaId] ?? vaId,
          count,
        }))
        setBreakdown(rows)
      } catch {
        // silently skip
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

        {/* Stat cards */}
        <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card lg:px-6">

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Active Assignments</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? '—' : stats?.activeAssignmentsCount ?? 0}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <UsersIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">VA–client assignments currently active</div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Entries Today</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? '—' : stats?.totalEntriesToday ?? 0}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <UserCheckIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">Work entries logged across all VAs today</div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>EODs Submitted Today</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? '—' : stats?.eodSubmissionsToday ?? 0}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ClipboardXIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">
                {loading ? '' : `${stats?.missingEodsToday ?? 0} missing`}
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Missing EODs Today</CardDescription>
              <CardTitle
                className={`@[250px]/card:text-3xl text-2xl font-semibold tabular-nums ${
                  !loading && (stats?.missingEodsToday ?? 0) > 0 ? 'text-destructive' : ''
                }`}
              >
                {loading ? '—' : stats?.missingEodsToday ?? 0}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <AlertTriangleIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">Active assignments with no EOD yet</div>
            </CardFooter>
          </Card>

        </div>

        {/* Quick actions */}
        <div className="flex gap-3 px-4 lg:px-6">
          <Button asChild>
            <Link to="/admin/assignments">
              <UsersIcon className="size-4" />
              Manage Assignments
            </Link>
          </Button>
          {!isAccountManager && (
            <Button asChild variant="outline">
              <Link to="/admin/accounts">View Accounts</Link>
            </Button>
          )}
        </div>

        {/* Per-VA breakdown */}
        {!loading && breakdown.length > 0 && (
          <div className="px-4 lg:px-6">
            <h2 className="mb-3 text-sm font-medium text-foreground">VA Activity Today</h2>
            <DataTable columns={breakdownColumns} data={breakdown} />
          </div>
        )}

      </div>
    </div>
  )
}
