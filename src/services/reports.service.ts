import api from '@/lib/api';

export type ReportType = 'work_entries' | 'eod' | 'performance';
export type ExportFormat = 'csv' | 'xlsx';

/**
 * Export from ats-crm-backend.
 * Endpoints: /crm/reports/work-entries/export, /crm/reports/eod-submissions/export, /crm/reports/performance/export
 * Supports ?format=csv (default) and ?format=xlsx for Excel.
 */
export async function exportReport(
  type: ReportType,
  dateFrom: string,
  dateTo: string,
  format: ExportFormat = 'csv'
): Promise<void> {
  const endpointMap: Record<ReportType, string> = {
    work_entries: '/crm/reports/work-entries/export',
    eod: '/crm/reports/eod-submissions/export',
    performance: '/crm/reports/performance/export',
  };

  const response = await api.get(endpointMap[type], {
    params: { startDate: dateFrom, endDate: dateTo, format },
    responseType: 'blob',
  });

  const ext = format === 'xlsx' ? 'xlsx' : 'csv';
  const fileName = `${type}_${dateFrom}_${dateTo}.${ext}`;
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
