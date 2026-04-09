export interface IEodSubmission {
  id: string
  assignment_id: string
  date: string // 'YYYY-MM-DD'
  shift_start: string // 'HH:MM'
  shift_end: string // 'HH:MM'
  hours_worked: number
  summary_of_work: string
  pending_tasks: string
  blockers: string
  notes?: string
  created_at: string
}

export interface CreateEodPayload {
  assignment_id: string
  date: string
  shift_start: string
  shift_end: string
  hours_worked: number
  summary_of_work: string
  pending_tasks: string
  blockers: string
  notes?: string
}
