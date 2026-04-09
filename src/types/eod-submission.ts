export interface IEodSubmission {
  id: string
  assignmentId: string
  vaId: string
  clientId: string
  date: string // 'YYYY-MM-DD'
  shiftStart: string // 'HH:MM'
  shiftEnd: string // 'HH:MM'
  hoursWorked: number
  summaryOfWork: string
  pendingTasks: string
  blockers: string
  notes?: string
  createdAt: string
}

export interface CreateEodPayload {
  assignmentId: string
  date: string
  shiftStart: string
  shiftEnd: string
  hoursWorked: number
  summaryOfWork: string
  pendingTasks: string
  blockers: string
  notes?: string
}
