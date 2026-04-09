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

export const WORK_ENTRY_STATUSES = [
  'completed',
  'in_progress',
  'pending',
] as const
export type WorkEntryStatus = (typeof WORK_ENTRY_STATUSES)[number]

export interface IWorkEntry {
  id: string
  assignmentId: string
  vaId: string
  clientId: string
  entryDate: string // 'YYYY-MM-DD'
  entryTime: string // 'HH:MM'
  taskCategory: WorkEntryCategory
  taskDescription: string
  timeSpent: number // minutes
  status: WorkEntryStatus
  notes?: string
  createdAt: string
}

export interface CreateWorkEntryPayload {
  assignmentId: string
  entryDate: string
  entryTime: string
  taskCategory: WorkEntryCategory
  taskDescription: string
  timeSpent: number
  status: WorkEntryStatus
  notes?: string
}

export interface UpdateWorkEntryPayload {
  entryDate?: string
  entryTime?: string
  taskCategory?: WorkEntryCategory
  taskDescription?: string
  timeSpent?: number
  status?: WorkEntryStatus
  notes?: string
}
