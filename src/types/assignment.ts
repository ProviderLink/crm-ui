export interface IAssignment {
  id: string
  client_id: string
  va_id: string
  status: 'active' | 'paused' | 'ended'
  service_type?: string
  account_manager_id?: string
  start_date: string
  end_date?: string
  notes?: string
  created_at: string
}
