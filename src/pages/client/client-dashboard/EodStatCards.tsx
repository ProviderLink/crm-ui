import { ActivityIcon, CalendarCheckIcon } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { formatMonthDay } from './helpers';

export function EodComplianceCard({
  eodCompliance,
  loading,
}: {
  eodCompliance: number | null;
  loading: boolean;
}) {
  return (
          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>EOD Compliance</CardDescription>
              <CardTitle
                className={`@[250px]/card:text-3xl text-2xl font-semibold tabular-nums ${
                  !loading && eodCompliance !== null
                    ? eodCompliance >= 80
                      ? 'text-green-400'
                      : eodCompliance >= 50
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    : ''
                }`}
              >
                {loading ? (
                  <Skeleton className="h-8 w-16 rounded-md mt-0.5" />
                ) : eodCompliance === null ? (
                  '—'
                ) : (
                  `${eodCompliance}%`
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <CalendarCheckIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <div className="flex flex-col items-start gap-1 p-6 pt-0 text-sm">
              <div className="text-muted-foreground">
                End-of-day reports last 7 working days
              </div>
            </div>
          </Card>
  );
}

export function LastEodCard({
  lastEodDate,
  loading,
}: {
  lastEodDate: string | null;
  loading: boolean;
}) {
  return (
          <Card className="@container/card">
            <CardHeader className="relative">
              <CardDescription>Last EOD Submitted</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? (
                  <Skeleton className="h-8 w-24 rounded-md mt-0.5" />
                ) : lastEodDate ? (
                  <span className="text-xl">
                    {formatMonthDay(lastEodDate)}
                  </span>
                ) : (
                  '—'
                )}
              </CardTitle>
              <div className="absolute right-4 top-4">
                <ActivityIcon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <div className="flex flex-col items-start gap-1 p-6 pt-0 text-sm">
              <div className="text-muted-foreground">
                Most recent end-of-day report
              </div>
            </div>
          </Card>
  );
}
