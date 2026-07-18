import api from '@/lib/api';

export type ReportType = 'work_entries' | 'eod' | 'performance';

/**
 * Export CSV from ats-crm-backend.
 * Endpoints: /crm/reports/work-entries/export, /crm/reports/eod-submissions/export, /crm/reports/performance/export
 */
export async function exportReport(
  type: ReportType,
  dateFrom: string,
  dateTo: string
): Promise<void> {
  const endpointMap: Record<ReportType, string> = {
    work_entries: '/crm/reports/work-entries/export',
    eod: '/crm/reports/eod-submissions/export',
    performance: '/crm/reports/performance/export',
  };

  const response = await api.get(endpointMap[type], {
    params: { startDate: dateFrom, endDate: dateTo },
    responseType: 'blob',
  });

  const fileName = `${type}_${dateFrom}_${dateTo}.csv`;
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
