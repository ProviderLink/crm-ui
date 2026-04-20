import type { LucideIcon } from 'lucide-react'

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  label: string
  value: number
  isLoading: boolean
  icon: LucideIcon
  footer: string
  valueClassName?: string
}

export function StatCard({
  label,
  value,
  isLoading,
  icon: Icon,
  footer,
  valueClassName = '',
}: StatCardProps) {
  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={`@[250px]/card:text-3xl text-2xl font-semibold tabular-nums ${valueClassName}`}
        >
          {isLoading ? (
            <Skeleton className="h-8 w-12 rounded-md mt-0.5" />
          ) : (
            value
          )}
        </CardTitle>
        <div className="absolute right-4 top-4">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="text-muted-foreground">{footer}</div>
      </CardFooter>
    </Card>
  )
}
