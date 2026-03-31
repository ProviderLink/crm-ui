export const WORK_ENTRY_CATEGORIES = [
  'Administrative',
  'Clinical Coordination',
  'Data Entry',
  'Communication',
  'Research',
  'Scheduling',
  'Other',
] as const

export type WorkEntryCategory = (typeof WORK_ENTRY_CATEGORIES)[number]

export const WORK_ENTRY_STATUSES = ['completed', 'in_progress', 'pending'] as const
export type WorkEntryStatus = (typeof WORK_ENTRY_STATUSES)[number]

export interface IWorkEntry {
  id: string
  assignment_id: string
  entry_date: string   // 'YYYY-MM-DD'
  entry_time: string   // 'HH:MM'
  task_category: WorkEntryCategory
  task_description: string
  time_spent: number   // minutes
  status: WorkEntryStatus
  notes?: string
  created_at: string
}

export interface CreateWorkEntryPayload {
  assignment_id: string
  entry_date: string
  entry_time: string
  task_category: WorkEntryCategory
  task_description: string
  time_spent: number
  status: WorkEntryStatus
  notes?: string
}
