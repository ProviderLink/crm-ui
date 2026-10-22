import type { ColumnDef } from '@tanstack/react-table';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { DataTable } from '@/components/shared/DataTable';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

// ─── Chart config ─────────────────────────────────────────────────────────────

const activityChartConfig = {
  count: { label: 'Entries', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

export type VABreakdownRow = {
  vaId: string;
  vaName: string;
  count: number;
  hours: number;
  tasks: number;
};

const breakdownColumns: ColumnDef<VABreakdownRow>[] = [
  { accessorKey: 'vaName', header: 'VA' },
  { accessorKey: 'hours', header: 'Hours' },
  { accessorKey: 'tasks', header: 'Tasks Done' },
  { accessorKey: 'count', header: 'Entries' },
];

export function VaActivityCard({ breakdown }: { breakdown: VABreakdownRow[] }) {
  return (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  VA Activity This Week
                </CardTitle>
                <CardDescription>
                  Work entries logged per VA in the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ChartContainer
                  config={activityChartConfig}
                  className="h-[200px] w-full"
                >
                  <BarChart
                    data={breakdown}
                    margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="vaName"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      width={28}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
                <DataTable columns={breakdownColumns} data={breakdown} />
              </CardContent>
            </Card>
  );
}
