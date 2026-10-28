import { ArrowRightIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type VABreakdownRow = {
  vaId: string;
  vaName: string;
  count: number;
  hours: number;
  tasks: number;
};

type Metric = 'hours' | 'tasks' | 'count';

/**
 * With more VAs than this, only the busiest and the quietest are charted, so a
 * long list never stretches the page; the full list lives in Scorecards.
 */
const MAX_ROWS = 8;
const TOP_ROWS = 5;
const ROW_HEIGHT = 36;
const AXIS_HEIGHT = 28;

const METRICS: {
  key: Metric;
  label: string;
  format: (v: number) => string;
  summary: (v: number) => string;
}[] = [
  {
    key: 'hours',
    label: 'Hours',
    format: v => `${v.toLocaleString()}h`,
    summary: v => `${v.toLocaleString()}h logged`,
  },
  {
    key: 'tasks',
    label: 'Tasks done',
    format: v => v.toLocaleString(),
    summary: v => `${v.toLocaleString()} tasks done`,
  },
  {
    key: 'count',
    label: 'Entries',
    format: v => v.toLocaleString(),
    summary: v => `${v.toLocaleString()} entries`,
  },
];

const config = {
  value: { label: 'Value', color: 'var(--text-secondary)' },
} satisfies ChartConfig;

const GRID = 'rgba(255,255,255,0.06)';
const MUTED = 'var(--text-tertiary)';

/** 1,000 -> 1K, so axis ticks stay short whatever the size of the numbers. */
const compact = (v: number) =>
  v >= 1_000_000
    ? `${v / 1_000_000}M`
    : v >= 1_000
      ? `${v / 1_000}K`
      : String(v);

const shortName = (name: string) =>
  name.length > 16 ? `${name.slice(0, 15)}…` : name;

type ChartRow = VABreakdownRow & { value: number };

function ChartTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-foreground">{row.vaName}</p>
      <dl className="space-y-0.5 text-muted-foreground">
        <div className="flex justify-between gap-6">
          <dt>Hours</dt>
          <dd className="tabular-nums text-foreground">
            {row.hours.toLocaleString()}h
          </dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt>Tasks done</dt>
          <dd className="tabular-nums text-foreground">
            {row.tasks.toLocaleString()}
          </dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt>Entries</dt>
          <dd className="tabular-nums text-foreground">
            {row.count.toLocaleString()}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** How much each VA has done over the last 7 days: one bar per VA. */
export function VaActivityCard({
  breakdown,
  scorecardsPath,
}: {
  breakdown: VABreakdownRow[];
  scorecardsPath: string;
}) {
  const [metric, setMetric] = useState<Metric>('hours');
  const current = METRICS.find(m => m.key === metric)!;

  const rows: ChartRow[] = breakdown
    .map(r => ({ ...r, value: r[metric] }))
    .sort((a, b) => b.value - a.value);
  const trimmed = rows.length > MAX_ROWS;
  const visible = trimmed
    ? [...rows.slice(0, TOP_ROWS), ...rows.slice(-(MAX_ROWS - TOP_ROWS))]
    : rows;
  const total = Math.round(rows.reduce((sum, r) => sum + r.value, 0) * 10) / 10;

  return (
    <Card className="gap-4 p-5">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 p-0">
        <div>
          <CardTitle className="text-sm font-medium">
            VA activity, last 7 days
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {current.summary(total)} across {rows.length}{' '}
            {rows.length === 1 ? 'VA' : 'VAs'}
            {trimmed &&
              ` · top ${TOP_ROWS} and lowest ${MAX_ROWS - TOP_ROWS} shown`}
          </p>
        </div>
        <Tabs value={metric} onValueChange={v => setMetric(v as Metric)}>
          <TabsList className="h-8">
            {METRICS.map(m => (
              <TabsTrigger key={m.key} value={m.key} className="px-3 text-xs">
                {m.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0">
        <ChartContainer
          config={config}
          className="w-full"
          style={{ height: visible.length * ROW_HEIGHT + AXIS_HEIGHT }}
        >
          <BarChart
            data={visible}
            layout="vertical"
            margin={{ top: 0, right: 80, bottom: 0, left: 0 }}
            barSize={10}
          >
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={compact}
              tick={{ fill: MUTED, fontSize: 11 }}
              allowDecimals={false}
              domain={[0, 'auto']}
            />
            <YAxis
              type="category"
              dataKey="vaName"
              width={118}
              tickLine={false}
              axisLine={false}
              tickFormatter={shortName}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            />
            <Tooltip
              content={<ChartTip />}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              isAnimationActive={false}
            />
            <Bar
              dataKey="value"
              fill="var(--text-secondary)"
              radius={[0, 4, 4, 0]}
              activeBar={{ fill: 'var(--foreground)' }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v: number) => current.format(v)}
                style={{
                  fill: 'var(--foreground)',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
        <Link
          to={scorecardsPath}
          className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {trimmed ? `View all ${rows.length} VAs` : 'View scorecards'}
          <ArrowRightIcon className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
