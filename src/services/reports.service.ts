import api from '@/lib/api'

export type ReportType = 'work_entries' | 'eod'
export type ReportFormat = 'csv' | 'excel'

export interface ExportReportParams {
  type: ReportType
  dateFrom: string
  dateTo: string
  format: ReportFormat
}

export async function exportReport(params: ExportReportParams): Promise<void> {
  const query = new URLSearchParams({
    type:     params.type,
    dateFrom: params.dateFrom,
    dateTo:   params.dateTo,
    format:   params.format,
  })

  const response = await api.get(`/reports/export?${query.toString()}`, {
    responseType: 'blob',
  })

  const extension = params.format === 'excel' ? 'xlsx' : 'csv'
  const fileName = `${params.type}_${params.dateFrom}_${params.dateTo}.${extension}`

  const url = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
