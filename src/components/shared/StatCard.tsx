import type { LucideIcon } from 'lucide-react'

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCountUp } from '@/hooks/useCountUp'

interface StatCardProps {
  label: string
  value: number
  isLoading: boolean
  icon: LucideIcon
  footer?: React.ReactNode
  valueClassName?: string
}

function AnimatedValue({ value }: { value: number }) {
  const display = useCountUp(value)
  return <>{display}</>
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
            <div className="flex items-center gap-1 mt-1">
              <Skeleton className="h-7 w-10 rounded-md" />
            </div>
          ) : (
            <AnimatedValue value={value} />
          )}
        </CardTitle>
        <div className="absolute right-4 top-4">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="text-muted-foreground text-sm">
          {isLoading ? <Skeleton className="h-4 w-32 rounded-md" /> : footer}
        </div>
      </CardFooter>
    </Card>
  )
}
