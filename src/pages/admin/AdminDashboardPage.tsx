import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangleIcon,
  ClipboardXIcon,
  DownloadIcon,
  UserCheckIcon,
  UsersIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { z } from 'zod';

import { DataTable } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
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
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAtsClientsQuery,
  useAtsVAsQuery,
  useDashboardStatsQuery,
} from '@/hooks/queries';
import { useAppSelector } from '@/hooks/store';
import { exportReport } from '@/services/reports.service';

// ─── Export form ─────────────────────────────────────────────────────────────

const exportSchema = z
  .object({
    type: z.enum(['work_entries', 'eod', 'performance']),
    dateFrom: z.string().min(1, 'Required'),
    dateTo: z.string().min(1, 'Required'),
  })
  .refine(d => d.dateFrom <= d.dateTo, {
    message: '"From" date must be before or equal to "To" date',
    path: ['dateTo'],
  });
type ExportFormData = z.infer<typeof exportSchema>;

// ─── Chart config ─────────────────────────────────────────────────────────────

const activityChartConfig = {
  count: { label: 'Entries', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

type VABreakdownRow = { vaName: string; count: number };
type ClientBreakdownRow = { clientName: string; count: number };

const breakdownColumns: ColumnDef<VABreakdownRow>[] = [
  { accessorKey: 'vaName', header: 'VA' },
  { accessorKey: 'count', header: 'Entries Today' },
];

const clientBreakdownColumns: ColumnDef<ClientBreakdownRow>[] = [
  { accessorKey: 'clientName', header: 'Client' },
  { accessorKey: 'count', header: 'Entries Today' },
];

export default function AdminDashboardPage() {
  const user = useAppSelector(s => s.auth.user);
  const isAccountManager = user?.role === 'account_manager';

  const { data: stats, isLoading: loadingStats } = useDashboardStatsQuery();
  const { data: atsVAs = [], isLoading: loadingVAs } = useAtsVAsQuery();
  const { data: atsClients = [], isLoading: loadingClients } =
    useAtsClientsQuery();
  const loading = loadingVAs || loadingClients;

  const vaMap: Record<string, string> = {};
  for (const va of atsVAs) vaMap[va.id] = `${va.firstName} ${va.lastName}`;

  // New backend shape has overview.* instead of top-level fields.
  // perVABreakdown / perClientBreakdown are not yet available — show empty.
  const overview = stats?.overview;

  const clientMap: Record<string, string> = {};
  for (const c of atsClients) clientMap[c.id] = c.companyName;

  const breakdown: VABreakdownRow[] = [];
  const clientBreakdown: ClientBreakdownRow[] = [];

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExportFormData>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      type: 'work_entries',
      dateFrom: '',
      dateTo: '',
    },
  });

  async function onExport(values: ExportFormData) {
    setExporting(true);
    setExportError(null);
    try {
      await exportReport(values.type, values.dateFrom, values.dateTo);
    } catch {
      setExportError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Stat cards */}
        <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card lg:px-6">
          <StatCard
            label="Active Assignments"
            value={overview?.activeAssignments ?? 0}
            isLoading={loadingStats}
            icon={UsersIcon}
            footer="VA–client assignments currently active"
          />
          <StatCard
            label="Entries Today"
            value={overview?.totalWorkEntriesToday ?? 0}
            isLoading={loadingStats}
            icon={UserCheckIcon}
            footer="Work entries logged across all VAs today"
          />
          <StatCard
            label="EODs Submitted Today"
            value={overview?.totalEodSubmissionsToday ?? 0}
            isLoading={loadingStats}
            icon={ClipboardXIcon}
            footer="End-of-day reports submitted today"
          />
          <StatCard
            label="Missing EODs Today"
            value={overview?.missingEodsToday ?? 0}
            isLoading={loadingStats}
            icon={AlertTriangleIcon}
            footer="Active assignments with no EOD yet"
            valueClassName={
              !loadingStats && (overview?.missingEodsToday ?? 0) > 0
                ? 'text-destructive'
                : ''
            }
          />
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

        {/* Per-VA breakdown — chart + table */}
        {!loading && breakdown.length > 0 && (
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  VA Activity Today
                </CardTitle>
                <CardDescription>
                  Work entries logged per VA today
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
          </div>
        )}

        {/* Per-client breakdown */}
        {!loading && clientBreakdown.length > 0 && (
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  Client Activity Today
                </CardTitle>
                <CardDescription>
                  Work entries logged per client today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={clientBreakdownColumns}
                  data={clientBreakdown}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Export data */}
        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Export Data
              </CardTitle>
              <CardDescription>
                Download work entries or EOD submissions as CSV or Excel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onExport)}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                {/* Report type */}
                <div className="grid gap-1.5">
                  <Label>Report Type</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="work_entries">
                            Work Entries
                          </SelectItem>
                          <SelectItem value="eod">EOD Submissions</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && (
                    <p className="text-xs text-destructive">
                      {errors.type.message}
                    </p>
                  )}
                </div>

                {/* Date from */}
                <div className="grid gap-1.5">
                  <Label>From</Label>
                  <Controller
                    name="dateFrom"
                    control={control}
                    render={({ field }) => (
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pick a date"
                      />
                    )}
                  />
                  {errors.dateFrom && (
                    <p className="text-xs text-destructive">
                      {errors.dateFrom.message}
                    </p>
                  )}
                </div>

                {/* Date to */}
                <div className="grid gap-1.5">
                  <Label>To</Label>
                  <Controller
                    name="dateTo"
                    control={control}
                    render={({ field }) => (
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pick a date"
                      />
                    )}
                  />
                  {errors.dateTo && (
                    <p className="text-xs text-destructive">
                      {errors.dateTo.message}
                    </p>
                  )}
                </div>

                {/* Submit — spans full row */}
                <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                  <Button type="submit" disabled={exporting}>
                    <DownloadIcon className="size-4" />
                    {exporting ? 'Downloading…' : 'Download Report'}
                  </Button>
                  {exportError && (
                    <p className="text-sm text-destructive">{exportError}</p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
