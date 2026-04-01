import { Link } from 'react-router-dom'
import { AlertTriangleIcon, ClipboardXIcon, UsersIcon, UserCheckIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppSelector } from '@/hooks/store'

export default function AdminDashboardPage() {
  const user = useAppSelector((s) => s.auth.user)
  const isAccountManager = user?.role === 'account_manager'

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

        {/* Stat cards */}
        <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card lg:px-6">

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Active VAs</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                —
              </CardTitle>
              <div className="absolute right-4 top-4">
                <UsersIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">VAs currently on assignment</div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Active Clients</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                —
              </CardTitle>
              <div className="absolute right-4 top-4">
                <UserCheckIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">Clients with active accounts</div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Missing EODs Today</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                —
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ClipboardXIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">VAs who haven't submitted EOD</div>
            </CardFooter>
          </Card>

          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Accounts at Risk</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                —
              </CardTitle>
              <div className="absolute right-4 top-4">
                <AlertTriangleIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="text-muted-foreground">Accounts flagged for low health score</div>
            </CardFooter>
          </Card>

        </div>

        {/* Quick actions */}
        <div className="flex gap-3 px-4 lg:px-6">
          <Button asChild>
            <Link to="/admin/accounts">
              <UsersIcon className="size-4" />
              View Accounts
            </Link>
          </Button>
          {!isAccountManager && (
            <Button asChild variant="outline">
              <Link to="/admin/accounts">
                Manage Assignments
              </Link>
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}
