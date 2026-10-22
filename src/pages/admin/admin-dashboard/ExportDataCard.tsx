import { zodResolver } from '@hookform/resolvers/zod';
import { DownloadIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportReport, type ExportFormat } from '@/services/reports.service';

const exportSchema = z
  .object({
    type: z.enum(['work_entries', 'eod', 'performance']),
    format: z.enum(['csv', 'xlsx']),
    dateFrom: z.string().min(1, 'Required'),
    dateTo: z.string().min(1, 'Required'),
  })
  .refine(d => d.dateFrom <= d.dateTo, {
    message: '"From" date must be before or equal to "To" date',
    path: ['dateTo'],
  });
type ExportFormData = z.infer<typeof exportSchema>;

export function ExportDataCard() {
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
      format: 'csv',
      dateFrom: '',
      dateTo: '',
    },
  });

  async function onExport(values: ExportFormData) {
    setExporting(true);
    setExportError(null);
    try {
      await exportReport(
        values.type,
        values.dateFrom,
        values.dateTo,
        values.format as ExportFormat
      );
    } catch {
      setExportError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
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

                {/* Format */}
                <div className="grid gap-1.5">
                  <Label>Format</Label>
                  <Controller
                    name="format"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
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
  );
}
