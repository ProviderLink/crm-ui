import { useState } from 'react';

import { useApiMutation } from '@/hooks/use-api-mutation';
import {
  exportReport,
  type ExportFormat,
  type ReportType,
} from '@/services/reports.service';

/**
 * Export of a report for a date range, as CSV or Excel. The range is the one
 * the page's filters already show, so there is a single date range on screen.
 */
export function useReportExport(range: { dateFrom: string; dateTo: string }) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const rangeValid =
    range.dateFrom !== '' &&
    range.dateTo !== '' &&
    range.dateFrom <= range.dateTo;

  const download = useApiMutation({
    mutationFn: (type: ReportType) =>
      exportReport(type, range.dateFrom, range.dateTo, format),
    errorMessage: 'Export failed. Please try again.',
  });

  return {
    format,
    setFormat,
    rangeValid,
    exporting: download.isPending,
    error: download.error,
    run: (type: ReportType) => (rangeValid ? download.run(type) : undefined),
  };
}
